require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { db, ensureSchema } = require("./db");

const auth = require("./middleware/auth");
const publicRateLimit = require("./middleware/publicRateLimit");
const completionsRoutes = require("./routes/completions");
const conversationsRoutes = require("./routes/conversations");
const mediaRoutes = require("./routes/media");
const diagnosticsRoutes = require("./routes/diagnostics");
const userAuthRoutes = require("./routes/userAuth");
const { renderChatPage } = require("./routes/webChat");

const app = express();

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.get("/", (req, res) => {
    res.set("Content-Type", "text/html");
    res.send(renderChatPage());
});

app.get("/status", (req, res) => {
    res.json({ name: "SonicGPT API", health: "ok" });
});

app.get("/api/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autorisé" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await ensureSchema();
        const userResult = await db.execute({
            sql: "SELECT id, email, name, avatar_url FROM users WHERE id = ?",
            args: [decoded.userId]
        });
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }
        const user = userResult.rows[0];
        res.json({
            userId: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url
        });
    } catch (e) {
        res.status(401).json({ error: "Token invalide" });
    }
});

app.use("/api/auth", userAuthRoutes);

app.use("/v1", auth, completionsRoutes);
app.use("/v1", auth, conversationsRoutes);
app.use("/v1", auth, mediaRoutes);
app.use("/diagnostics", diagnosticsRoutes);

app.use("/public/v1", publicRateLimit, conversationsRoutes);
app.use("/public/v1", publicRateLimit, mediaRoutes);

app.use((req, res) => {
    res.status(404).json({ error: { message: "Route introuvable." } });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: { message: "Erreur serveur inattendue." } });
});

module.exports = app;