function renderChatPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SonicGPT</title>
<style>
    * { box-sizing: border-box; }
    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #0f1117;
        color: #e8e8ea;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    header {
        padding: 16px 20px;
        border-bottom: 1px solid #23252e;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    header h1 {
        font-size: 18px;
        margin: 0;
        background: linear-gradient(90deg, #7c5cff, #38d0ff);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
    header button {
        background: none;
        border: 1px solid #35374a;
        color: #9a9cb0;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
    }
    header button:hover { border-color: #7c5cff; color: #e8e8ea; }
    #messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .bubble {
        max-width: 75%;
        padding: 10px 14px;
        border-radius: 14px;
        line-height: 1.4;
        font-size: 14px;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    .user { align-self: flex-end; background: #7c5cff; color: white; border-bottom-right-radius: 4px; }
    .bot { align-self: flex-start; background: #1c1e29; border-bottom-left-radius: 4px; }
    .status { align-self: flex-start; color: #7a7d94; font-size: 12px; font-style: italic; }
    .bubble img { max-width: 260px; border-radius: 10px; display: block; margin-top: 6px; }
    .bubble audio { margin-top: 6px; width: 240px; }
    #inputBar {
        display: flex;
        gap: 8px;
        padding: 14px 20px;
        border-top: 1px solid #23252e;
    }
    #inputBar input {
        flex: 1;
        background: #1c1e29;
        border: 1px solid #2c2e3a;
        color: #e8e8ea;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 14px;
        outline: none;
    }
    #inputBar input:focus { border-color: #7c5cff; }
    #inputBar button {
        background: #7c5cff;
        border: none;
        color: white;
        padding: 0 18px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
    }
    #inputBar button:disabled { opacity: 0.5; cursor: default; }
</style>
</head>
<body>

<header id="mainHeader">
    <h1>SonicGPT</h1>
    <button id="resetBtn">Réinitialiser</button>
</header>
<div id="messages"></div>
<div id="inputBar">
    <input id="textInput" type="text" placeholder="Écris à SonicGPT...">
    <button id="sendBtn">Envoyer</button>
</div>

<script>
const messagesEl = document.getElementById("messages");
const inputBar = document.getElementById("inputBar");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");

let ownerId = localStorage.getItem("sonicgpt_owner_id");
let conversationId = localStorage.getItem("sonicgpt_conversation_id");

if (!ownerId) {
    ownerId = "web-" + crypto.randomUUID();
    localStorage.setItem("sonicgpt_owner_id", ownerId);
}

textInput.focus();

async function ensureConversation() {
    if (conversationId) return conversationId;
    const res = await fetch("/public/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "sonicgpt-1", ownerId })
    });
    if (!res.ok) throw new Error("Impossible de créer la conversation.");
    const data = await res.json();
    conversationId = data.id;
    localStorage.setItem("sonicgpt_conversation_id", conversationId);
    return conversationId;
}

function addBubble(role, text) {
    const el = document.createElement("div");
    el.className = "bubble " + role;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
}

function addStatus(text) {
    const el = document.createElement("div");
    el.className = "status";
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
}

function addMedia(bubble, mediaType, base64, mimeType) {
    const url = "data:" + mimeType + ";base64," + base64;
    if (mediaType === "image") {
        const img = document.createElement("img");
        img.src = url;
        bubble.appendChild(img);
    } else if (mediaType === "audio") {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = url;
        bubble.appendChild(audio);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
    const text = textInput.value.trim();
    if (!text) return;
    textInput.value = "";
    sendBtn.disabled = true;

    addBubble("user", text);
    const statusEl = addStatus("SonicGPT réfléchit...");

    try {
        const convId = await ensureConversation();
        const res = await fetch("/public/v1/conversations/" + convId + "/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text, stream: true, callerId: ownerId })
        });

        if (!res.ok || !res.body) throw new Error("Erreur serveur (" + res.status + ")");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let botBubble = null;
        let fullText = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\\n\\n");
            buffer = parts.pop();

            for (const part of parts) {
                const line = part.trim();
                if (!line.startsWith("data:")) continue;
                const data = line.slice(5).trim();
                if (!data) continue;
                let json;
                try { json = JSON.parse(data); } catch (e) { continue; }

                if (json.type === "tool_call") {
                    statusEl.textContent = "🛠️ " + json.tool + "...";
                } else if (json.type === "delta") {
                    if (!botBubble) { statusEl.remove(); botBubble = addBubble("bot", ""); }
                    fullText += json.delta;
                    botBubble.textContent = fullText;
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                } else if (json.type === "media") {
                    if (!botBubble) { statusEl.remove(); botBubble = addBubble("bot", ""); }
                    addMedia(botBubble, json.mediaType, json.base64, json.mimeType);
                } else if (json.type === "done") {
                    if (statusEl.parentNode) statusEl.remove();
                } else if (json.type === "error") {
                    if (statusEl.parentNode) statusEl.remove();
                    addBubble("bot", "❌ Erreur : " + (json.error || "problème inconnu"));
                }
            }
        }
    } catch (e) {
        if (statusEl.parentNode) statusEl.remove();
        addBubble("bot", "❌ " + e.message);
    } finally {
        sendBtn.disabled = false;
        textInput.focus();
    }
}

sendBtn.addEventListener("click", sendMessage);
textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

resetBtn.addEventListener("click", async () => {
    if (!conversationId) return;
    await fetch("/public/v1/conversations/" + conversationId, {
        method: "DELETE"
    }).catch(() => {});
    localStorage.removeItem("sonicgpt_conversation_id");
    conversationId = null;
    messagesEl.innerHTML = "";
    addStatus("Conversation réinitialisée.");
});
</script>
</body>
</html>`;
}

module.exports = { renderChatPage };
