const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, ensureSchema } = require("../db");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// On construit l'URL de redirection dynamiquement
function getRedirectUri(req) {
    // Si on est sur Vercel, on force l'URL de prod. Sinon, on utilise l'hôte de la requête.
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
    }
    return `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
}

router.get("/google", (req, res) => {
    const redirectUri = getRedirectUri(req);
    const authorizeUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        prompt: "consent",
        redirect_uri: redirectUri
    });
    res.redirect(authorizeUrl);
});

router.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code manquant.");

    try {
        await ensureSchema();
        
        const redirectUri = getRedirectUri(req);
        
        // On passe un objet avec le code ET l'URL de redirection
        const { tokens } = await client.getToken({
            code: code,
            redirect_uri: redirectUri
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
        res.status(500).send("Erreur d'authentification. Détails : " + e.message); // On affiche l'erreur pour comprendre
    }
});

module.exports = router;