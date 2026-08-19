const express = require("express");
const { db, ensureSchema } = require("../db");
const { generateImage, editImage } = require("../services/gemini");
const { generateVoice } = require("../services/voicerss");

const router = express.Router();

async function updateLastImageForOwner(ownerId, base64, mimeType) {
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
                sql: "UPDATE conversations SET last_image_base64 = ?, last_image_mime = ? WHERE id = ?",
                args: [base64, mimeType, conversation.id]
            });
        }
    } catch (e) {
        console.error("[media] Impossible de mettre à jour last_image_base64 :", e.message);
    }
}

router.post("/images/generations", async (req, res) => {
    try {
        const { prompt, ownerId } = req.body || {};
        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'prompt' (string) est requis." } });
        }
        const result = await generateImage({ prompt });
        await updateLastImageForOwner(ownerId, result.base64, result.mimeType);
        res.json({ base64: result.base64, mimeType: result.mimeType, prompt });
    } catch (e) {
        console.error(e);
        if (e.message === "GEMINI_KEY_MISSING") {
            return res.status(500).json({ error: { message: "GEMINI_API_KEY non configurée côté serveur." } });
        }
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

router.post("/images/edit", async (req, res) => {
    try {
        const { instruction, ownerId } = req.body || {};
        if (!instruction || typeof instruction !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'instruction' (string) est requis." } });
        }
        if (!ownerId) {
            return res.status(400).json({ error: { message: "Le champ 'ownerId' est requis." } });
        }

        await ensureSchema();
        const result = await db.execute({
            sql: "SELECT last_image_base64, last_image_mime FROM conversations WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 1",
            args: [ownerId]
        });
        const stored = result.rows[0];

        if (!stored || !stored.last_image_base64) {
            return res.status(400).json({
                error: { message: "Aucune image récente à modifier. Génère d'abord une image." }
            });
        }

        const edited = await editImage({
            base64: stored.last_image_base64,
            mimeType: stored.last_image_mime,
            instruction
        });
        await updateLastImageForOwner(ownerId, edited.base64, edited.mimeType);
        res.json({ base64: edited.base64, mimeType: edited.mimeType, instruction });
    } catch (e) {
        console.error(e);
        if (e.message === "GEMINI_KEY_MISSING") {
            return res.status(500).json({ error: { message: "GEMINI_API_KEY non configurée côté serveur." } });
        }
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

router.post("/voice/generations", async (req, res) => {
    try {
        const { text } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'text' (string) est requis." } });
        }
        const result = await generateVoice({ text });
        res.json({ base64: result.base64, mimeType: result.mimeType, text });
    } catch (e) {
        console.error(e);
        if (e.message === "VOICERSS_KEY_MISSING") {
            return res.status(500).json({ error: { message: "VOICERSS_API_KEY non configurée côté serveur." } });
        }
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

module.exports = router;
