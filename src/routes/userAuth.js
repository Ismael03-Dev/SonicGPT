const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");

const router = express.Router();

// On nettoie les variables au cas où il y aurait des espaces ou des sauts de ligne invisibles
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const REDIRECT_URI = "https://sonic-gpt.vercel.app/api/auth/google/callback";

router.get("/google", (req, res) => {
    const authorizeUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        prompt: "consent",
        redirect_uri: REDIRECT_URI
    });
    res.redirect(authorizeUrl);
});

router.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code manquant.");

    try {
        await ensureSchema();
        
        // On force l'envoi du code, du redirect_uri et du secret
        const { tokens } = await client.getToken({
            code: code,
            redirect_uri: REDIRECT_URI,
            client_secret: GOOGLE_CLIENT_SECRET
        });
        
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        const userResult = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
        let userId;

        if (userResult.rows.length === 0) {
            userId = crypto.randomUUID();
            await db.execute({ sql: "INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)", args: [userId, email, name || "Utilisateur", picture || null] });
        } else {
            userId = userResult.rows[0].id;
        }

        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
        res.redirect(`/?token=${token}`);
    } catch (e) {
        console.error("[auth] Erreur Google :", e.message);
        res.status(500).send("Erreur d'authentification. Détails : " + e.message);
    }
});

module.exports = router;