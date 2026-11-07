const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");

const router = express.Router();

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
const REDIRECT_URI = "https://sonic-gpt.vercel.app/api/auth/google/callback";

function createClient() {
    return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

router.get("/google", (req, res) => {
    const authorizeUrl = createClient().generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email"
        ],
        prompt: "consent"
    });
    res.redirect(authorizeUrl);
});

router.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code manquant.");

    try {
        await ensureSchema();

        const client = createClient();
        const { tokens } = await client.getToken(code);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID
        });
        const { email, name, picture } = ticket.getPayload();

        const userResult = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [email]
        });

        let userId;
        if (userResult.rows.length === 0) {
            userId = crypto.randomUUID();
            await db.execute({
                sql: "INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)",
                args: [userId, email, name || "Utilisateur", picture || null]
            });
        } else {
            userId = userResult.rows[0].id;
        }

        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
        res.redirect(`/?token=${token}`);
    } catch (e) {
        console.error("[auth] Erreur Google :", e.message);
        res.status(500).send("Erreur d'authentification.");
    }
});

module.exports = router;