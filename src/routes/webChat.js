function renderChatPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SonicGPT</title>
<link rel="icon" type="image/jpeg" href="https://imgur.com/PeWYQV.jpeg">
<style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f1117; color: #e8e8ea; height: 100vh; display: flex; flex-direction: column; }
    header { padding: 16px 20px; border-bottom: 1px solid #23252e; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    header h1 { font-size: 18px; margin: 0; background: linear-gradient(90deg, #7c5cff, #38d0ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
    header button { background: none; border: 1px solid #35374a; color: #9a9cb0; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; }
    #messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
    .bubble { max-width: 75%; padding: 10px 14px; border-radius: 14px; line-height: 1.45; font-size: 14px; word-wrap: break-word; animation: fadeIn 0.15s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .user { align-self: flex-end; background: #7c5cff; color: white; border-bottom-right-radius: 4px; }
    .bot { align-self: flex-start; background: #1c1e29; border-bottom-left-radius: 4px; }
    .status { align-self: flex-start; color: #7a7d94; font-size: 12px; font-style: italic; }
    .bubble img { max-width: 260px; border-radius: 10px; display: block; margin-top: 6px; cursor: pointer; }
    .bubble audio { margin-top: 6px; width: 240px; }
    .preview { display: flex; align-items: center; gap: 10px; padding: 8px 20px; border-top: 1px solid #23252e; background: #14151d; }
    .preview img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
    .preview span { font-size: 12px; color: #9a9cb0; flex: 1; }
    .preview button { background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 16px; }
    #inputBar { display: flex; gap: 8px; padding: 14px 20px; border-top: 1px solid #23252e; flex-shrink: 0; align-items: center; }
    #inputBar input[type="text"] { flex: 1; background: #1c1e29; border: 1px solid #2c2e3a; color: #e8e8ea; padding: 10px 14px; border-radius: 10px; font-size: 14px; outline: none; }
    .iconBtn { background: #1c1e29; border: 1px solid #2c2e3a; color: #9a9cb0; width: 38px; height: 38px; border-radius: 10px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    #sendBtn { background: #7c5cff; border: none; color: white; padding: 0 18px; height: 38px; border-radius: 10px; cursor: pointer; font-size: 14px; flex-shrink: 0; }
</style>
</head>
<body>

<header id="mainHeader">
    <div style="display:flex;align-items:center;gap:10px;">
        <img src="https://i.imgur.com/PeWYQV.jpeg" alt="SonicGPT" style="width:32px;height:32px;border-radius:8px;object-fit:cover;">
        <h1>SonicGPT</h1>
    </div>
    <button id="resetBtn">Réinitialiser</button>
</header>
<div id="messages"></div>
<div class="preview" id="previewBar" style="display:none">
    <img id="previewImg" src="" alt="">
    <span id="previewLabel"></span>
    <button id="previewRemove">✕</button>
</div>
<div id="inputBar">
    <input type="file" id="fileInput" accept="image/*" style="display:none">
    <button class="iconBtn" id="attachBtn" title="Envoyer une image">📎</button>
    <input id="textInput" type="text" placeholder="Écris à SonicGPT...">
    <button id="sendBtn">Envoyer</button>
</div>

<script>
const messagesEl = document.getElementById("messages");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const previewBar = document.getElementById("previewBar");
const previewImg = document.getElementById("previewImg");
const previewLabel = document.getElementById("previewLabel");
const previewRemove = document.getElementById("previewRemove");

let ownerId = localStorage.getItem("sonicgpt_owner_id");
let conversationId = localStorage.getItem("sonicgpt_conversation_id");
let pendingImage = null;

if (!ownerId) {
    ownerId = "web-" + crypto.randomUUID();
    localStorage.setItem("sonicgpt_owner_id", ownerId);
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function renderMarkdown(text) {
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\\n\\n+/g, "<br><br>");
    return escaped;
}

function addBubble(role, html) {
    const el = document.createElement("div");
    el.className = "bubble " + role;
    el.innerHTML = html;
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
        img.addEventListener("click", () => window.open(url, "_blank"));
        bubble.appendChild(img);
    } else if (mediaType === "audio") {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = url;
        bubble.appendChild(audio);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

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

attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        pendingImage = { base64, mimeType: file.type };
        previewImg.src = "data:" + file.type + ";base64," + base64;
        previewLabel.textContent = file.name;
        previewBar.style.display = "flex";
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
});

previewRemove.addEventListener("click", () => {
    pendingImage = null;
    previewBar.style.display = "none";
});

async function sendMessage() {
    const text = textInput.value.trim();
    if (!text && !pendingImage) return;

    const image = pendingImage;
    pendingImage = null;
    previewBar.style.display = "none";
    textInput.value = "";
    sendBtn.disabled = true;

    const userBubble = addBubble("user", escapeHtml(text) || "&nbsp;");
    if (image) addMedia(userBubble, "image", image.base64, image.mimeType);

    const statusEl = addStatus("SonicGPT réfléchit...");

    try {
        const convId = await ensureConversation();
        
        // CORRECTION : ajout de webAccess: true
        const payload = { content: text, stream: true, callerId: ownerId, webAccess: true };
        if (image) {
            payload.imageBase64 = image.base64;
            payload.imageMimeType = image.mimeType;
        }

        const res = await fetch("/public/v1/conversations/" + convId + "/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
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
                    botBubble.innerHTML = renderMarkdown(fullText);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                } else if (json.type === "media") {
                    if (!botBubble) { statusEl.remove(); botBubble = addBubble("bot", ""); }
                    addMedia(botBubble, json.mediaType, json.base64, json.mimeType);
                } else if (json.type === "done") {
                    if (statusEl.parentNode) statusEl.remove();
                } else if (json.type === "error") {
                    if (statusEl.parentNode) statusEl.remove();
                    addBubble("bot", "❌ Erreur : " + escapeHtml(json.error || "problème inconnu"));
                }
            }
        }
    } catch (e) {
        if (statusEl.parentNode) statusEl.remove();
        addBubble("bot", "❌ " + escapeHtml(e.message));
    } finally {
        sendBtn.disabled = false;
        textInput.focus();
    }
}

sendBtn.addEventListener("click", sendMessage);
textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

resetBtn.addEventListener("click", async () => {
    if (!conversationId) return;
    await fetch("/public/v1/conversations/" + conversationId, { method: "DELETE" }).catch(() => {});
    localStorage.removeItem("sonicgpt_conversation_id");
    conversationId = null;
    messagesEl.innerHTML = "";
});
</script>
</body>
</html>`;
}

module.exports = { renderChatPage };