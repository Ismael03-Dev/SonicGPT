const express = require("express");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");
const { DEFAULT_MODEL, buildSystemPrompt, resolveModel, MODELS } = require("../config/models");
const { runToolLoop } = require("../services/agent");
const { TOOLS } = require("../config/tools");
const { simulateStream } = require("../utils/streamText");

const router = express.Router();

function makeTitle(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    return clean.length > 60 ? clean.slice(0, 57) + "..." : clean || "Nouvelle conversation";
}

router.post("/conversations", async (req, res) => {
    await ensureSchema();
    try {
        const { model = DEFAULT_MODEL, title, ownerId } = req.body || {};
        if (!MODELS[model]) {
            return res.status(400).json({
                error: { message: `Modèle inconnu. Options : ${Object.keys(MODELS).join(", ")}` }
            });
        }
        const id = crypto.randomUUID();
        await db.execute({
            sql: "INSERT INTO conversations (id, title, model, owner_id) VALUES (?, ?, ?, ?)",
            args: [id, title || "Nouvelle conversation", model, ownerId || null]
        });
        res.status(201).json({ id, title: title || "Nouvelle conversation", model });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

router.get("/conversations", async (req, res) => {
    await ensureSchema();
    try {
        let { ownerId, page = 1, limit = 20 } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (page - 1) * limit;

        const where = ownerId ? "WHERE owner_id = ?" : "";
        const args = ownerId ? [ownerId] : [];

        const result = await db.execute({
            sql: `SELECT id, title, model, created_at, updated_at FROM conversations
                  ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
        });

        res.json({ conversations: result.rows, page, limit });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

router.get("/conversations/:id", async (req, res) => {
    await ensureSchema();
    try {
        const convResult = await db.execute({
            sql: "SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ?",
            args: [req.params.id]
        });
        const conversation = convResult.rows[0];
        if (!conversation) return res.status(404).json({ error: { message: "Conversation introuvable." } });

        const messagesResult = await db.execute({
            sql: "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            args: [req.params.id]
        });

        res.json({ ...conversation, messages: messagesResult.rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

router.delete("/conversations/:id", async (req, res) => {
    await ensureSchema();
    try {
        const result = await db.execute({
            sql: "DELETE FROM conversations WHERE id = ?",
            args: [req.params.id]
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: { message: "Conversation introuvable." } });
        }
        res.json({ message: "Conversation supprimée." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

router.post("/conversations/:id/messages", async (req, res) => {
    await ensureSchema();
    try {
        const {
            content,
            stream = true,
            temperature = 0.7,
            max_tokens = 400,
            webAccess = true,
            callerId = null
        } = req.body || {};

        if (!content || typeof content !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'content' (string) est requis." } });
        }

        const convResult = await db.execute({
            sql: "SELECT * FROM conversations WHERE id = ?",
            args: [req.params.id]
        });
        const conversation = convResult.rows[0];
        if (!conversation) return res.status(404).json({ error: { message: "Conversation introuvable." } });

        const IDLE_RESET_MS = 30 * 1000;
        const lastActivity = new Date(conversation.updated_at.replace(" ", "T") + "Z").getTime();
        const idleMs = Date.now() - lastActivity;
        if (idleMs > IDLE_RESET_MS) {
            await db.execute({
                sql: "DELETE FROM messages WHERE conversation_id = ?",
                args: [req.params.id]
            });
        }

        const historyResult = await db.execute({
            sql: "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            args: [req.params.id]
        });
        const history = historyResult.rows.map(r => ({ role: r.role, content: r.content }));
        const fullMessages = [
            { role: "system", content: buildSystemPrompt(callerId) },
            ...history,
            { role: "user", content }
        ];

        const isFirstMessage = history.length === 0;

        await db.execute({
            sql: "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
            args: [req.params.id, content]
        });

        const modelConfig = resolveModel(conversation.model);

        const finalizeConversation = async (assistantContent) => {
            const updates = ["updated_at = datetime('now')"];
            const args = [];
            if (isFirstMessage) {
                updates.push("title = ?");
                args.push(makeTitle(content));
            }
            args.push(req.params.id);
            await db.execute({
                sql: `UPDATE conversations SET ${updates.join(", ")} WHERE id = ?`,
                args
            });
            await db.execute({
                sql: "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
                args: [req.params.id, assistantContent]
            });
        };

        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();

            try {
                const { content: assistantContent, finishReason } = await runToolLoop({
                    model: modelConfig.mistralModel,
                    messages: fullMessages,
                    tools: webAccess ? TOOLS : undefined,
                    temperature,
                    maxTokens: max_tokens,
                    onToolCall: ({ name, args }) => {
                        res.write(
                            `data: ${JSON.stringify({ type: "tool_call", tool: name, input: args, done: false })}\n\n`
                        );
                    }
                });

                await simulateStream(assistantContent, (chunk) => {
                    res.write(`data: ${JSON.stringify({ type: "delta", delta: chunk, done: false })}\n\n`);
                });

                res.write(`data: ${JSON.stringify({ type: "done", done: true, finishReason })}\n\n`);
                res.end();
                await finalizeConversation(assistantContent);
            } catch (e) {
                console.error(e);
                res.write(`data: ${JSON.stringify({ type: "error", error: "Erreur du modèle.", done: true })}\n\n`);
                res.end();
            }
            return;
        }

        const { content: assistantContent, finishReason, usage, toolsUsed } = await runToolLoop({
            model: modelConfig.mistralModel,
            messages: fullMessages,
            tools: webAccess ? TOOLS : undefined,
            temperature,
            maxTokens: max_tokens
        });

        await finalizeConversation(assistantContent);

        res.json({ role: "assistant", content: assistantContent, finishReason, usage, toolsUsed });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

module.exports = router;