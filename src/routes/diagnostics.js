const express = require("express");

const router = express.Router();

router.get("/groq-models", async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY non configurée côté serveur." });
        }

        const response = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            return res.status(response.status).json({ error: text.slice(0, 500) });
        }

        const json = await response.json();
        const ids = (json.data || []).map(m => m.id).sort();

        res.json({
            total: ids.length,
            modelesDisponibles: ids
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
