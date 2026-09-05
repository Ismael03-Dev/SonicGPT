const { db, ensureSchema } = require("../db");

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress || "unknown";
}

async function publicRateLimit(req, res, next) {
    const ip = getClientIp(req);

    try {
        await ensureSchema();
        const result = await db.execute({
            sql: "SELECT count, window_start FROM rate_limits WHERE ip = ?",
            args: [ip]
        });
        const row = result.rows[0];
        const now = Date.now();

        if (!row) {
            await db.execute({
                sql: "INSERT INTO rate_limits (ip, count, window_start) VALUES (?, 1, ?)",
                args: [ip, new Date(now).toISOString()]
            });
            return next();
        }

        const windowStart = new Date(row.window_start).getTime();
        if (now - windowStart > WINDOW_MS) {
            await db.execute({
                sql: "UPDATE rate_limits SET count = 1, window_start = ? WHERE ip = ?",
                args: [new Date(now).toISOString(), ip]
            });
            return next();
        }

        if (row.count >= MAX_REQUESTS_PER_WINDOW) {
            return res.status(429).json({
                error: { message: "Trop de messages envoyés. Réessaie dans un moment." }
            });
        }

        await db.execute({
            sql: "UPDATE rate_limits SET count = count + 1 WHERE ip = ?",
            args: [ip]
        });
        next();
    } catch (e) {
        console.error("[publicRateLimit] Erreur, requête laissée passer par prudence :", e.message);
        next();
    }
}

module.exports = publicRateLimit;
