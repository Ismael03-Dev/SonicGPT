function auth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-api-key"];
    const expected = process.env.SONICGPT_API_KEY;

    if (!expected) {
        return res.status(500).json({
            error: { message: "SONICGPT_API_KEY non configurée côté serveur.", type: "server_error" }
        });
    }
    if (!token || token !== expected) {
        return res.status(401).json({
            error: { message: "Clé API invalide ou manquante.", type: "invalid_request_error" }
        });
    }
    next();
}

module.exports = auth;
