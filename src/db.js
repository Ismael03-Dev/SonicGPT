const { createClient } = require("@libsql/client");

if (!process.env.TURSO_DATABASE_URL) {
    console.warn(
        "[db] TURSO_DATABASE_URL manquant. Ajoute tes variables d'env (voir .env.example)."
    );
}

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

let initPromise = null;

async function migrateAddColumn(table, column, definition) {
    try {
        await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (e) {
        if (!String(e.message || "").toLowerCase().includes("duplicate column")) {
            console.error(`[db] Migration ${table}.${column} échouée :`, e.message);
        }
    }
}

function ensureSchema() {
    if (!initPromise) {
        initPromise = db
            .batch(
                [
                    `CREATE TABLE IF NOT EXISTS conversations (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
                        model TEXT NOT NULL DEFAULT 'sonicgpt-1',
                        owner_id TEXT,
                        created_at TEXT NOT NULL DEFAULT (datetime('now')),
                        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                    )`,
                    `CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id)`,
                    `CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                        content TEXT NOT NULL,
                        created_at TEXT NOT NULL DEFAULT (datetime('now'))
                    )`,
                    `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`
                ],
                "write"
            )
            .then(() => migrateAddColumn("conversations", "last_image_base64", "TEXT"))
            .then(() => migrateAddColumn("conversations", "last_image_mime", "TEXT"));
    }
    return initPromise;
}

module.exports = { db, ensureSchema };
