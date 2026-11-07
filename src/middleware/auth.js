const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
    const authHeader = req.headers.authorization || req.headers["x-api-key"];

    if (!authHeader) {
        return res.status(401).json({ error: { message: "Authentification requise." } });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (token.startsWith("ey")) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (e) {
            return res.status(401).json({ error: { message: "Token JWT invalide ou expiré." } });
        }
    }

    const apiKey = process.env.SONICGPT_API_KEY;
    if (token !== apiKey) {
        return res.status(401).json({ error: { message: "Clé API invalide." } });
    }

    next();
};