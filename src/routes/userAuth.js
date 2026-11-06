const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get("/google", (req, res) => {
    const authorizeUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        prompt: "consent",
        redirect_uri: "https://sonic-gpt.vercel.app/api/auth/google/callback"
    });
    res.redirect(authorizeUrl);
});

router.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code manquant.");

    try {
        await ensureSchema();
        
        // CORRECTION ICI : on passe le redirect_uri à getToken
        const { tokens } = await client.getToken({
            code: code,
            redirect_uri: "https://sonic-gpt.vercel.app/api/auth/google/callback"
        });
        
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
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

        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.redirect(`/?token=${token}`);
    } catch (e) {
        console.error("[auth] Erreur Google :", e.message);
        res.status(500).send("Erreur d'authentification.");
    }
});

module.exports = router;