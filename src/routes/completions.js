const express = require("express");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");
const { MODELS, DEFAULT_MODEL, SYSTEM_PROMPT, resolveModel } = require("../config/models");
const { completeMistralChat, streamMistralChat } = require("../services/mistral");

const router = express.Router();

// GET /v1/models — format proche de l'API OpenAI
router.get("/models", (req, res) => {
    res.json({
        object: "list",
        data: Object.entries(MODELS).map(([id, m]) => ({
            id,
            object: "model",
            owned_by: "sonicgpt",
            description: m.description
        }))
    });
});

// POST /v1/chat/completions — stateless, format OpenAI.
// Le client envoie tout l'historique dans "messages" à chaque appel,
// comme avec l'API OpenAI/Claude classique. Persistance optionnelle
// si un "conversation_id" existant est fourni.
router.post("/chat/completions", async (req, res) => {
    try {
        const {
            model = DEFAULT_MODEL,
            messages,
            stream = false,
            temperature = 0.7,
            max_tokens = 1024,
            conversation_id
        } = req.body || {};

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: { message: "Le champ 'messages' (array non vide) est requis.", type: "invalid_request_error" }
            });
        }

        const modelConfig = resolveModel(model);
        const fullMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
        const completionId = `chatcmpl-${crypto.randomUUID()}`;
        const created = Math.floor(Date.now() / 1000);

        const persist = async (assistantContent) => {
            if (!conversation_id) return;
            try {
                await ensureSchema();
                const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                if (lastUserMsg) {
                    await db.execute({
                        sql: "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
                        args: [conversation_id, lastUserMsg.content]
                    });
                }
                await db.execute({
                    sql: "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
                    args: [conversation_id, assistantContent]
                });
                await db.execute({
                    sql: "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
                    args: [conversation_id]
                });
            } catch (e) {
                console.error("[persist] échec silencieux:", e.message);
            }
        };

        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();

            const sendChunk = (delta, finishReason = null) => {
                const chunk = {
                    id: completionId,
                    object: "chat.completion.chunk",
                    created,
                    model,
                    choices: [{ index: 0, delta: delta, finish_reason: finishReason }]
                };
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            };

            try {
                sendChunk({ role: "assistant" });
                const { content, finishReason } = await streamMistralChat({
                    model: modelConfig.mistralModel,
                    messages: fullMessages,
                    temperature,
                    maxTokens: max_tokens,
                    onDelta: (delta) => sendChunk({ content: delta })
                });
                sendChunk({}, finishReason);
                res.write("data: [DONE]\n\n");
                res.end();
                await persist(content);
            } catch (e) {
                console.error(e);
                res.write(`data: ${JSON.stringify({ error: { message: "Erreur du modèle." } })}\n\n`);
                res.end();
            }
            return;
        }

        const { content, finishReason, usage } = await completeMistralChat({
            model: modelConfig.mistralModel,
            messages: fullMessages,
            temperature,
            maxTokens: max_tokens
        });

        await persist(content);

        res.json({
            id: completionId,
            object: "chat.completion",
            created,
            model,
            choices: [
                {
                    index: 0,
                    message: { role: "assistant", content },
                    finish_reason: finishReason
                }
            ],
            usage: usage
                ? {
                      prompt_tokens: usage.prompt_tokens,
                      completion_tokens: usage.completion_tokens,
                      total_tokens: usage.total_tokens
                  }
                : undefined
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur.", type: "server_error" } });
    }
});

module.exports = router;
