const express = require("express");
const { generateImage } = require("../services/cloudflare");
const { generateVoice } = require("../services/ttsEdge");
const { transcribeAudio } = require("../services/cloudflareStt");

const router = express.Router();

router.post("/images/generations", async (req, res) => {
    try {
        const { prompt } = req.body || {};
        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'prompt' (string) est requis." } });
        }
        const result = await generateImage({ prompt });
        res.json({ base64: result.base64, mimeType: result.mimeType, prompt });
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
        const { audioUrl } = req.body || {};
        if (!audioUrl || typeof audioUrl !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'audioUrl' (string) est requis." } });
        }

        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
            throw new Error(`AUDIO_FETCH_ERROR_${audioResponse.status}`);
        }
        const arrayBuffer = await audioResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

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
