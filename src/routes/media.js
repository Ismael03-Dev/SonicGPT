const express = require("express");
const { buildImageUrl, buildAudioUrl } = require("../services/pollinations");

const router = express.Router();

router.post("/images/generations", async (req, res) => {
    try {
        const { prompt, width, height, model } = req.body || {};
        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: { message: "Le champ 'prompt' (string) est requis." } });
        }
        const url = buildImageUrl({ prompt, width, height, model });
        res.json({ url, prompt });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: { message: "Erreur serveur." } });
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
