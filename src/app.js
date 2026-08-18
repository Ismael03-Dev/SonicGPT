require("dotenv").config();
const express = require("express");
const cors = require("cors");

const auth = require("./middleware/auth");
const completionsRoutes = require("./routes/completions");
const conversationsRoutes = require("./routes/conversations");
const mediaRoutes = require("./routes/media");

const app = express();

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.get("/", (req, res) => {
    res.json({
        name: "SonicGPT API",
        docs: "Voir README.md pour la liste complète des routes.",
        health: "ok"
    });
});

app.use("/v1", auth, completionsRoutes);
app.use("/v1", auth, conversationsRoutes);
app.use("/v1", auth, mediaRoutes);

app.use((req, res) => {
    res.status(404).json({ error: { message: "Route introuvable." } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: { message: "Erreur serveur inattendue." } });
});

module.exports = app;
