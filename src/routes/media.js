const express = require("express");
const { db, ensureSchema } = require("../db");
const { buildImageUrl, buildAudioUrl } = require("../services/pollinations");
const { editImage } = require("../services/imageEdit");

const router = express.Router();

async function updateLastImageForOwner(ownerId, url) {
    if (!ownerId) return;
    try {
        await ensureSchema();
        const result = await db.execute({
            sql: "SELECT id FROM conversations WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 1",
            args: [ownerId]
        });
        const conversation = result.rows[0];
        if (conversation) {
            await db.execute({
                sql: "UPDATE conversations SET last_image_url = ? WHERE id = ?",
                args: [url, conversation.id]
            });
        }
    } catch (e) {
        console.error("[media] Impossible de mettre à jour last_image_url :", e.message);
    }
}

router.post("/images/generations", async (req, res) => {
    try {
        const { prompt, width, height, model, ownerId } = req.body || {};
        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'prompt' (string) est requis." } });
        }
        const url = buildImageUrl({ prompt, width, height, model });
        await updateLastImageForOwner(ownerId, url);
        res.json({ url, prompt });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

router.post("/images/edit", async (req, res) => {
    try {
        const { instruction, imageUrl, ownerId } = req.body || {};
        if (!instruction || typeof instruction !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'instruction' (string) est requis." } });
        }

        let targetUrl = imageUrl || null;
        if (!targetUrl && ownerId) {
            await ensureSchema();
            const result = await db.execute({
                sql: "SELECT last_image_url FROM conversations WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 1",
                args: [ownerId]
            });
            targetUrl = result.rows[0]?.last_image_url || null;
        }

        if (!targetUrl) {
            return res.status(400).json({
                error: { message: "Aucune image récente à modifier. Fournis 'imageUrl' ou génère d'abord une image." }
            });
        }

        const result = await editImage({ imageUrl: targetUrl, instruction });
        await updateLastImageForOwner(ownerId, result.url);
        res.json({ url: result.url, instruction });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

router.post("/voice/generations", async (req, res) => {
    try {
        const { text, voice } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'text' (string) est requis." } });
        }
        const url = buildAudioUrl({ text, voice });
        res.json({ url, text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
    }
});

module.exports = router;
