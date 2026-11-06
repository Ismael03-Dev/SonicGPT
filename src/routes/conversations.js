const express = require("express");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");
const { DEFAULT_MODEL, buildSystemPrompt, resolveModel, MODELS } = require("../config/models");
const { TOOLS, executeTool } = require("../config/tools");
const { simulateStream } = require("../utils/streamText");
const { generateVoice } = require("../services/ttsEdge");
const { detectLanguage } = require("../utils/detectLanguage");
const { callMistralOnce } = require("../services/mistral");

const router = express.Router();

function makeTitle(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    return clean.length > 60 ? clean.slice(0, 57) + "..." : clean || "Nouvelle conversation";
}

function detectReasoningEffort(text) {
    const complexKeywords = /(maths?|mathématiques?|équation|calcul|résous|résoudre|démontre|démonstration|physique|chimie|biologie|exercice|problème|théorème|formule|intégrale|dérivée|probabilité|statistique|code|programmation|algorithme|explique|comment fonctionne)/i;
    return complexKeywords.test(text || "") ? "medium" : "low";
}

router.post("/conversations", async (req, res) => {
    await ensureSchema();
    try {
        const { model = DEFAULT_MODEL, title, ownerId } = req.body || {};
        if (!MODELS[model]) return res.status(400).json({ error: { message: "Modèle inconnu." } });
        const id = crypto.randomUUID();
        await db.execute({ sql: "INSERT INTO conversations (id, title, model, owner_id) VALUES (?, ?, ?, ?)", args: [id, title || "Nouvelle conversation", model, ownerId || null] });
        res.status(201).json({ id, title: title || "Nouvelle conversation", model });
    } catch (e) { console.error(e); res.status(500).json({ error: { message: "Erreur serveur." } }); }
});

router.get("/conversations", async (req, res) => {
    await ensureSchema();
    try {
        let { ownerId, page = 1, limit = 20 } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1); limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (page - 1) * limit;
        const where = ownerId ? "WHERE owner_id = ?" : ""; const args = ownerId ? [ownerId] : [];
        const result = await db.execute({ sql: `SELECT id, title, model, created_at, updated_at FROM conversations ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, args: [...args, limit, offset] });
        res.json({ conversations: result.rows, page, limit });
    } catch (e) { console.error(e); res.status(500).json({ error: { message: "Erreur serveur." } }); }
});

router.get("/conversations/:id", async (req, res) => {
    await ensureSchema();
    try {
        const convResult = await db.execute({ sql: "SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ?", args: [req.params.id] });
        const conversation = convResult.rows[0];
        if (!conversation) return res.status(404).json({ error: { message: "Conversation introuvable." } });
        const messagesResult = await db.execute({ sql: "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC", args: [req.params.id] });
        res.json({ ...conversation, messages: messagesResult.rows });
    } catch (e) { console.error(e); res.status(500).json({ error: { message: "Erreur serveur." } }); }
});

router.delete("/conversations/:id", async (req, res) => {
    await ensureSchema();
    try {
        const result = await db.execute({ sql: "DELETE FROM conversations WHERE id = ?", args: [req.params.id] });
        if (result.rowsAffected === 0) return res.status(404).json({ error: { message: "Conversation introuvable." } });
        res.json({ message: "Conversation supprimée." });
    } catch (e) { console.error(e); res.status(500).json({ error: { message: "Erreur serveur." } }); }
});

router.post("/conversations/:id/messages", async (req, res) => {
    await ensureSchema();
    try {
        const { content, stream = true, temperature = 0.7, max_tokens = 400, webAccess = true, callerId, callerName, imageUrl, imageBase64, imageMimeType, voiceInput = false, source = "bot" } = req.body || {};
        const effectiveImageUrl = imageUrl || (imageBase64 ? `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}` : null);
        if ((!content || typeof content !== "string") && !effectiveImageUrl) return res.status(400).json({ error: { message: "Le champ 'content' est requis." } });

        const convResult = await db.execute({ sql: "SELECT * FROM conversations WHERE id = ?", args: [req.params.id] });
        const conversation = convResult.rows[0];
        if (!conversation) return res.status(404).json({ error: { message: "Conversation introuvable." } });

        const IDLE_RESET_MS = 5 * 60 * 1000;
        const lastActivity = new Date(conversation.updated_at.replace(" ", "T") + "Z").getTime();
        const idleMs = Date.now() - lastActivity;
        let lastImageBase64 = conversation.last_image_base64 || null;
        let lastImageMimeType = conversation.last_image_mime || null;
        let lastImageUrl = conversation.last_image_url || null;
        if (idleMs > IDLE_RESET_MS) {
            await db.execute({ sql: "DELETE FROM messages WHERE conversation_id = ?", args: [req.params.id] });
            await db.execute({ sql: "UPDATE conversations SET last_image_base64 = NULL, last_image_mime = NULL, last_image_url = NULL WHERE id = ?", args: [req.params.id] });
            lastImageBase64 = null; lastImageMimeType = null; lastImageUrl = null;
        }

        if (imageUrl) { lastImageUrl = imageUrl; lastImageBase64 = null; lastImageMimeType = null; }
        else if (imageBase64) { lastImageBase64 = imageBase64; lastImageMimeType = imageMimeType || "image/jpeg"; lastImageUrl = null; }

        const historyResult = await db.execute({ sql: "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 6", args: [req.params.id] });
        const history = historyResult.rows.map(r => ({ role: r.role, content: String(r.content).slice(0, 600) })).reverse();
        const countResult = await db.execute({ sql: "SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?", args: [req.params.id] });
        const isFirstMessage = Number(countResult.rows[0]?.total || 0) === 0;

        const userMessageContent = effectiveImageUrl ? [{ type: "text", text: content || "Décris cette image." }, { type: "image_url", image_url: { url: effectiveImageUrl } }] : content;
        const fullMessages = [{ role: "system", content: buildSystemPrompt(callerId, callerName) }, ...history, { role: "user", content: userMessageContent }];
        const storedUserContent = effectiveImageUrl ? `[Image] ${content || ""}`.trim() : content;

        await db.execute({ sql: "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)", args: [req.params.id, storedUserContent] });

        const modelConfig = resolveModel(conversation.model);
        const VISION_MODELS = ["qwen/qwen3.8-27b", "meta-llama/llama-4-scout-17b-16e-instruct"];
        const activeModels = effectiveImageUrl ? VISION_MODELS : [modelConfig.mistralModel];
        const toolsForThisTurn = webAccess ? TOOLS : undefined;
        
        const reasoningEffort = detectReasoningEffort(content);

        const finalizeConversation = async (assistantContent, newLastImageBase64, newLastImageMimeType, newLastImageUrl) => {
            try {
                const updates = ["updated_at = datetime('now')"]; const args = [];
                if (isFirstMessage) { updates.push("title = ?"); args.push(makeTitle(storedUserContent)); }
                if (newLastImageBase64) { updates.push("last_image_base64 = ?", "last_image_mime = ?", "last_image_url = NULL"); args.push(newLastImageBase64, newLastImageMimeType || "image/jpeg"); }
                else if (newLastImageUrl) { updates.push("last_image_url = ?", "last_image_base64 = NULL", "last_image_mime = NULL"); args.push(newLastImageUrl); }
                args.push(req.params.id);
                await db.batch([{ sql: `UPDATE conversations SET ${updates.join(", ")} WHERE id = ?`, args }, { sql: "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", args: [req.params.id, assistantContent] }], "write");
            } catch (e) {
                if (e.message && e.message.includes("FOREIGN KEY")) return;
                console.error("[finalizeConversation] Erreur :", e.message);
            }
        };

        const imageKeywords = /(dessine|génère|genere|crée|cree|image|dessin|illustration|photo)/i;
        const forceImageTool = imageKeywords.test(content || "") && source === "web";

        if (forceImageTool && webAccess) {
            try {
                let cleanPrompt = content;
                try {
                    const promptGen = await callMistralOnce({
                        model: modelConfig.mistralModel,
                        messages: [{ role: "system", content: "Tu es un assistant qui transforme une demande d'image en un prompt de génération d'image clair et précis en ANGLAIS." }, { role: "user", content: content }],
                        temperature: 0.7, maxTokens: 100, reasoningEffort: "low"
                    });
                    if (promptGen && promptGen.message && promptGen.message.content) cleanPrompt = promptGen.message.content.trim().replace(/^"|"$/g, '');
                } catch (e) {}
                
                const toolResult = await executeTool("generate_image", JSON.stringify({ prompt: cleanPrompt }), { lastImageBase64, lastImageMimeType });
                
                if (toolResult && toolResult.base64) {
                    let finalText = "Tiens, voici ton image ! 🎨";
                    try {
                        const reaction = await callMistralOnce({ model: modelConfig.mistralModel, messages: [{ role: "system", content: "Écris une phrase courte et naturelle (max 15 mots) pour accompagner l'image, avec un emoji." }, { role: "user", content: `J'ai demandé : "${content}".` }], temperature: 0.8, maxTokens: 50, reasoningEffort: "low" });
                        if (reaction && reaction.message && reaction.message.content) finalText = reaction.message.content.trim();
                    } catch (e) {}

                    await finalizeConversation(finalText, toolResult.base64, toolResult.mimeType, null);
                    if (stream) {
                        res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
                        res.write(`data: ${JSON.stringify({ type: "media", tool: "generate_image", mediaType: "image", base64: toolResult.base64, mimeType: toolResult.mimeType, done: false })}\n\n`);
                        res.write(`data: ${JSON.stringify({ type: "delta", delta: finalText, done: false })}\n\n`);
                        res.write(`data: ${JSON.stringify({ type: "done", done: true, finishReason: "stop" })}\n\n`); res.end();
                    } else { res.json({ role: "assistant", content: finalText, media: [{ tool: "generate_image", mediaType: "image", base64: toolResult.base64, mimeType: toolResult.mimeType }] }); }
                } else {
                    const errorMsg = toolResult?.error || "Erreur inconnue";
                    if (stream) { res.setHeader("Content-Type", "text/event-stream"); res.write(`data: ${JSON.stringify({ type: "error", error: errorMsg, done: true })}\n\n`); res.end(); }
                    else { res.status(500).json({ error: { message: errorMsg } }); }
                }
            } catch (e) {
                if (!res.headersSent) { if (stream) { res.setHeader("Content-Type", "text/event-stream"); res.write(`data: ${JSON.stringify({ type: "error", error: e.message, done: true })}\n\n`); res.end(); } else { res.status(500).json({ error: { message: e.message } }); } }
            }
            return;
        }

        if (stream) {
            res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
            let hadAudioAlready = false;
            try {
                // Ici, on utilise le STREAMING DIRECT de Groq
                const body = { model: activeModels[0], messages: fullMessages, temperature, max_tokens: max_tokens, stream: true };
                if (toolsForThisTurn) { body.tools = toolsForThisTurn; body.tool_choice = "auto"; }
                if (body.model.includes("gpt-oss")) body.reasoning_effort = reasoningEffort;

                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
                    body: JSON.stringify(body)
                });

                if (!response.ok) throw new Error(`Groq API error ${response.status}`);

                const decoder = new TextDecoder();
                let buffer = "";
                let fullText = "";
                let finishReason = "stop";

                for await (const chunk of response.body) {
                    buffer += decoder.decode(chunk, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop();
                    for (const part of parts) {
                        const line = part.trim();
                        if (!line.startsWith("data:")) continue;
                        const data = line.slice(5).trim();
                        if (data === "[DONE]") continue;
                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta?.content;
                            const reason = json.choices?.[0]?.finish_reason;
                            if (reason) finishReason = reason;
                            if (delta) {
                                fullText += delta;
                                res.write(`data: ${JSON.stringify({ type: "delta", delta: delta, done: false })}\n\n`);
                            }
                        } catch (e) {}
                    }
                }

                const autoVoice = await generateVoice({ text: fullText, lang: detectLanguage(fullText) }).catch(() => null);
                if (autoVoice) res.write(`data: ${JSON.stringify({ type: "media", tool: "generate_voice", mediaType: "audio", base64: autoVoice.base64, mimeType: autoVoice.mimeType, done: false })}\n\n`);

                await finalizeConversation(fullText, null, null, null);
                res.write(`data: ${JSON.stringify({ type: "done", done: true, finishReason })}\n\n`); res.end();
            } catch (e) {
                console.error(e); res.write(`data: ${JSON.stringify({ type: "error", error: "Erreur du modèle.", done: true })}\n\n`); res.end();
            }
            return;
        }

        // Fallback non-streaming (si besoin)
        res.json({ role: "assistant", content: "Streaming désactivé pour cette requête." });
    } catch (e) { console.error(e); res.status(500).json({ error: { message: "Erreur serveur." } }); }
});

module.exports = router;