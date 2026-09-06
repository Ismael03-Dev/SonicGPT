const express = require("express");
const { db, ensureSchema } = require("../db");
const { generateImage, editImage } = require("../services/cloudflare");
const { generateVoice } = require("../services/ttsEdge");
const { transcribeAudio } = require("../services/cloudflareStt");

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
        if (e.message === "CLOUDFLARE_KEY_MISSING") {
            return res.status(500).json({ error: { message: "CF_ACCOUNT_ID/CF_API_TOKEN non configurés côté serveur." } });
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
        if (e.message === "CLOUDFLARE_KEY_MISSING") {
            return res.status(500).json({ error: { message: "CF_ACCOUNT_ID/CF_API_TOKEN non configurés côté serveur." } });
        }
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

router.post("/voice/generations", async (req, res) => {
    try {
        const { text, lang } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'text' (string) est requis." } });
        }
        const result = await generateVoice({ text, lang });
        res.json({ base64: result.base64, mimeType: result.mimeType, text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

router.post("/audio/transcriptions", async (req, res) => {
    try {
        const { audioUrl, audioBase64 } = req.body || {};
        if (!audioUrl && !audioBase64) {
            return res.status(400).json({ error: { message: "Le champ 'audioUrl' ou 'audioBase64' est requis." } });
        }

        let base64 = audioBase64;
        if (!base64) {
            const audioResponse = await fetch(audioUrl);
            if (!audioResponse.ok) {
                throw new Error(`AUDIO_FETCH_ERROR_${audioResponse.status}`);
            }
            const arrayBuffer = await audioResponse.arrayBuffer();
            base64 = Buffer.from(arrayBuffer).toString("base64");
        }

        const result = await transcribeAudio({ base64 });
        res.json({ text: result.text });
    } catch (e) {
        console.error(e);
        if (e.message === "CLOUDFLARE_KEY_MISSING") {
            return res.status(500).json({ error: { message: "CF_ACCOUNT_ID/CF_API_TOKEN non configurés côté serveur." } });
        }
        res.status(500).json({ error: { message: "Erreur serveur.", details: e.message } });
    }
});

module.exports = router;
