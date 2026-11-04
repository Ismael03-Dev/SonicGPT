const express = require("express");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");
const { DEFAULT_MODEL, buildSystemPrompt, resolveModel, MODELS } = require("../config/models");
const { runToolLoop } = require("../services/agent");
const { TOOLS } = require("../config/tools");
const { simulateStream } = require("../utils/streamText");
const { generateVoice } = require("../services/ttsEdge");
const { detectLanguage } = require("../utils/detectLanguage");

const router = express.Router();

function makeTitle(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    return clean.length > 60 ? clean.slice(0, 57) + "..." : clean || "Nouvelle conversation";
}

// ... (les routes POST /conversations, GET, DELETE, GET /:id restent identiques) ...
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
        const { content, stream = true, temperature = 0.7, max_tokens = 250, webAccess = true, callerId, callerName, imageUrl, imageBase64, imageMimeType, voiceInput = false } = req.body || {};
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

        // DÉTECTION POUR FORCER L'OUTIL
        const imageKeywords = /(dessine|génère|genere|crée|cree|image|dessin|illustration|photo)/i;
        const forceImageTool = imageKeywords.test(content || "");
        const toolChoice = forceImageTool ? "required" : "auto";

        console.log("[DEBUG WEB] webAccess:", webAccess, "| outils:", toolsForThisTurn ? "OUI" : "NON", "| toolChoice:", toolChoice, "| modèle:", activeModels[0]);

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

        const maybeAutoVoice = async (assistantContent, hadAudioAlready) => {
            if (!voiceInput || hadAudioAlready || !assistantContent) return null;
            try {
                const lang = detectLanguage(assistantContent);
                const result = await generateVoice({ text: assistantContent, lang });
                return { base64: result.base64, mimeType: result.mimeType };
            } catch (e) { return null; }
        };

        if (stream) {
            res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
            let hadAudioAlready = false;
            try {
                const { content: assistantContent, finishReason, lastImageBase64: newLastImageBase64, lastImageMimeType: newLastImageMimeType, lastImageUrl: newLastImageUrl } = await runToolLoop({
                    models: activeModels, messages: fullMessages, tools: toolsForThisTurn, toolChoice, temperature, maxTokens: max_tokens,
                    toolContext: { lastImageBase64, lastImageMimeType, lastImageUrl },
                    onToolCall: ({ name, args }) => { res.write(`data: ${JSON.stringify({ type: "tool_call", tool: name, input: args, done: false })}\n\n`); },
                    onToolResult: ({ name, result }) => {
                        if (result && result.error) console.error(`[tool ${name}] échec :`, result.error);
                        if ((name === "generate_image" || name === "generate_voice" || name === "edit_image") && result && result.base64) {
                            if (name === "generate_voice") hadAudioAlready = true;
                            res.write(`data: ${JSON.stringify({ type: "media", tool: name, mediaType: result.type, base64: result.base64, mimeType: result.mimeType, done: false })}\n\n`);
                        }
                    }
                });
                await simulateStream(assistantContent, (chunk) => { res.write(`data: ${JSON.stringify({ type: "delta", delta: chunk, done: false })}\n\n`); });
                const autoVoice = await maybeAutoVoice(assistantContent, hadAudioAlready);
                if (autoVoice) res.write(`data: ${JSON.stringify({ type: "media", tool: "generate_voice", mediaType: "audio", base64: autoVoice.base64, mimeType: autoVoice.mimeType, done: false })}\n\n`);
                await finalizeConversation(assistantContent, newLastImageBase64, newLastImageMimeType, newLastImageUrl);
                res.write(`data: ${JSON.stringify({ type: "done", done: true, finishReason })}\n\n`); res.end();
            } catch (e) {
                console.error(e); res.write(`data: ${JSON.stringify({ type: "error", error: "Erreur du modèle.", done: true })}\n\n`); res.end();
            }
            return;
        }

        const mediaResults = [];
        let hadAudioAlready = false;
        const { content: assistantContent, finishReason, usage, toolsUsed, lastImageBase64: newLastImageBase64, lastImageMimeType: newLastImageMimeType, lastImageUrl: newLastImageUrl } = await runToolLoop({
            models: activeModels, messages: fullMessages, tools: toolsForThisTurn, toolChoice, temperature, maxTokens: max_tokens,
            toolContext: { lastImageBase64, lastImageMimeType, lastImageUrl },
            onToolResult: ({ name, result }) => {
                if (result && result.error) console.error(`[tool ${name}] échec :`, result.error);
                if ((name === "generate_image" || name === "generate_voice" || name === "edit_image") && result && result.base64) {
                    if (name === "generate_voice") hadAudioAlready = true;
                    mediaResults.push({ tool: name, mediaType: result.type, base64: result.base64, mimeType: result.mimeType });
                }
            }
        });
        const autoVoice = await maybeAutoVoice(assistantContent, hadAudioAlready);
        if (autoVoice) mediaResults.push({ tool: "generate_voice", mediaType: "audio", base64: autoVoice.base64, mimeType: autoVoice.mimeType });
        await finalizeConversation(assistantContent, newLastImageBase64, newLastImageMimeType, newLastImageUrl);
        res.json({ role: "assistant", content: assistantContent, finishReason, usage, toolsUsed, media: mediaResults });
    } catch (e) { console.error(e); res.status(500).json({ error: { message: "Erreur serveur." } }); }
});

module.exports = router;