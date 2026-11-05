function renderChatPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SonicGPT</title>
<link rel="icon" type="image/jpeg" href="https://z-p3-cdn.fbsbx.com/v/t59.2708-21/885274190_1173039918622519_8580212649803707836_n.bin/file-1793814546610.bin?_nc_cat=103&ccb=1-7&_nc_sid=2b0e22&_nc_eui2=AeEXCduP0pKwsq73KIPJvpn2_ldEd7otEjz-V0R3ui0SPHW_DiOlZN5p2eRnpe7BYHWE3RqXYtZy3LUnpAw5iBkP&_nc_ohc=l3PdD39J2WIQ7kNvwEQNUPC&_nc_oc=AdpQu_Pkg-JT-dkI1ueTgYPlC8YUBcOCqZFOdYcva_KHXezDXpR_LA2JX-JwyPtQKFE&_nc_ad=z-m&_nc_cid=1400&_nc_zt=7&_nc_ht=z-p3-cdn.fbsbx.com&_nc_gid=k4mkU4OVhdY7J_TYmfK8fA&_nc_ss=7a338&oh=03_Q7cD6wFljDeR-LGHdTunDa7vKQgOjTuKHvGYZmhvJsynymGXHA&oe=6AED3B87&dl=1">
<meta property="og:title" content="SonicGPT">
<meta property="og:description" content="Discute avec SonicGPT, l'IA qui cherche sur le web, voit tes images et te répond en vocal.">
<meta property="og:image" content="https://z-p3-cdn.fbsbx.com/v/t59.2708-21/885274190_1173039918622519_8580212649803707836_n.bin/file-1793814546610.bin?_nc_cat=103&ccb=1-7&_nc_sid=2b0e22&_nc_eui2=AeEXCduP0pKwsq73KIPJvpn2_ldEd7otEjz-V0R3ui0SPHW_DiOlZN5p2eRnpe7BYHWE3RqXYtZy3LUnpAw5iBkP&_nc_ohc=l3PdD39J2WIQ7kNvwEQNUPC&_nc_oc=AdpQu_Pkg-JT-dkI1ueTgYPlC8YUBcOCqZFOdYcva_KHXezDXpR_LA2JX-JwyPtQKFE&_nc_ad=z-m&_nc_cid=1400&_nc_zt=7&_nc_ht=z-p3-cdn.fbsbx.com&_nc_gid=k4mkU4OVhdY7J_TYmfK8fA&_nc_ss=7a338&oh=03_Q7cD6wFljDeR-LGHdTunDa7vKQgOjTuKHvGYZmhvJsynymGXHA&oe=6AED3B87&dl=1">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:image" content="https://z-p3-cdn.fbsbx.com/v/t59.2708-21/885274190_1173039918622519_8580212649803707836_n.bin/file-1793814546610.bin?_nc_cat=103&ccb=1-7&_nc_sid=2b0e22&_nc_eui2=AeEXCduP0pKwsq73KIPJvpn2_ldEd7otEjz-V0R3ui0SPHW_DiOlZN5p2eRnpe7BYHWE3RqXYtZy3LUnpAw5iBkP&_nc_ohc=l3PdD39J2WIQ7kNvwEQNUPC&_nc_oc=AdpQu_Pkg-JT-dkI1ueTgYPlC8YUBcOCqZFOdYcva_KHXezDXpR_LA2JX-JwyPtQKFE&_nc_ad=z-m&_nc_cid=1400&_nc_zt=7&_nc_ht=z-p3-cdn.fbsbx.com&_nc_gid=k4mkU4OVhdY7J_TYmfK8fA&_nc_ss=7a338&oh=03_Q7cD6wFljDeR-LGHdTunDa7vKQgOjTuKHvGYZmhvJsynymGXHA&oe=6AED3B87&dl=1">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>

<style>
    :root {
        --bg: #0f1117;
        --bg-soft: #1c1e29;
        --bg-elev: #14151d;
        --border: #23252e;
        --border-soft: #2c2e3a;
        --text: #e8e8ea;
        --text-muted: #9a9cb0;
        --accent: #7c5cff;
        --accent-2: #38d0ff;
        --danger: #ff6b6b;
    }
    * { box-sizing: border-box; }
    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: var(--bg);
        color: var(--text);
        height: 100vh;
        height: 100dvh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
    .brand h1 {
        font-size: 18px;
        margin: 0;
        background: linear-gradient(90deg, var(--accent), var(--accent-2));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
    #resetBtn {
        background: none;
        border: 1px solid #35374a;
        color: var(--text-muted);
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
    }

    #messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scroll-behavior: smooth;
    }
    #messages::-webkit-scrollbar { width: 6px; }
    #messages::-webkit-scrollbar-thumb { background: var(--border-soft); border-radius: 3px; }

    .bubble {
        max-width: 85%;
        line-height: 1.6;
        font-size: 15px;
        word-wrap: break-word;
        animation: fadeIn 0.15s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .bubble p { margin: 0 0 10px 0; }
    .bubble p:last-child { margin-bottom: 0; }
    .bubble code {
        background: rgba(255,255,255,0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
        font-family: "SF Mono", Consolas, monospace;
    }
    .bubble pre {
        background: #0a0b10;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 10px 0;
    }
    .bubble pre code { background: none; padding: 0; }
    .bubble img { max-width: 300px; border-radius: 10px; display: block; margin-top: 10px; cursor: pointer; }
    
    .katex-display { margin: 12px 0; overflow-x: auto; overflow-y: hidden; }
    
    .user { 
        align-self: flex-end; 
        background: var(--accent); 
        color: white; 
        padding: 10px 16px;
        border-radius: 18px;
        border-bottom-right-radius: 4px; 
    }
    
    .bot { 
        align-self: flex-start; 
        background: transparent; 
        padding: 4px 0;
        max-width: 100%;
    }
    
    .error-bubble { border-left: 3px solid var(--danger); padding-left: 10px; }

    .status {
        align-self: flex-start;
        color: #7a7d94;
        font-size: 13px;
        font-style: italic;
    }

    #inputBar {
        display: flex;
        gap: 8px;
        padding: 14px 20px;
        border-top: 1px solid var(--border);
        flex-shrink: 0;
        align-items: center;
        position: relative;
        z-index: 10;
        background: var(--bg);
    }
    #textInput {
        flex: 1;
        background: var(--bg-soft);
        border: 1px solid var(--border-soft);
        color: var(--text);
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 15px;
        outline: none;
        -webkit-appearance: none;
    }
    .iconBtn {
        background: var(--bg-soft);
        border: 1px solid var(--border-soft);
        color: var(--text-muted);
        width: 42px; height: 42px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
    }
    #sendBtn {
        background: var(--accent);
        border: none;
        color: white;
        padding: 0 20px;
        height: 42px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 15px;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
    }
</style>
</head>
<body>

<header>
    <div class="brand">
        <h1>SonicGPT</h1>
    </div>
    <button id="resetBtn">Réinitialiser</button>
</header>

<div id="messages"></div>

<div id="inputBar">
    <input type="file" id="fileInput" accept="image/*" style="display:none">
    <button class="iconBtn" id="attachBtn">📎</button>
    <input id="textInput" type="text" placeholder="Écris à SonicGPT...">
    <button id="sendBtn">Envoyer</button>
</div>

<script>
const els = {
    messages: document.getElementById("messages"),
    textInput: document.getElementById("textInput"),
    sendBtn: document.getElementById("sendBtn"),
    resetBtn: document.getElementById("resetBtn"),
    attachBtn: document.getElementById("attachBtn"),
    fileInput: document.getElementById("fileInput")
};

const state = {
    ownerId: null,
    conversationId: null
};

function initOwner() {
    let ownerId = localStorage.getItem("sonicgpt_owner_id");
    if (!ownerId) {
        ownerId = "web-" + Date.now() + "-" + Math.random().toString(36).substring(2);
        localStorage.setItem("sonicgpt_owner_id", ownerId);
    }
    state.ownerId = ownerId;
    state.conversationId = localStorage.getItem("sonicgpt_conversation_id") || null;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function renderMarkdown(text) {
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\`\`\`([\s\S]*?)\`\`\`/g, (m, code) => "<pre><code>" + code.trim() + "</code></pre>");
    escaped = escaped.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
    const paragraphs = escaped.split(/\n\n+/).map(p => "<p>" + p + "</p>");
    return paragraphs.join("");
}

function renderMath(element) {
    if (typeof window.renderMathInElement === "function") {
        try {
            renderMathInElement(element, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false
            });
        } catch (e) {
            console.error("Erreur KaTeX :", e);
        }
    }
}

function addBubble(role, html, extraClass = "") {
    const el = document.createElement("div");
    el.className = "bubble " + role + (extraClass ? " " + extraClass : "");
    el.innerHTML = html;
    els.messages.appendChild(el);
    els.messages.scrollTop = els.messages.scrollHeight;
    return el;
}

async function ensureConversation() {
    if (state.conversationId) return state.conversationId;
    const res = await fetch("/public/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "sonicgpt-1", ownerId: state.ownerId })
    });
    if (!res.ok) throw new Error("Erreur création");
    const data = await res.json();
    state.conversationId = data.id;
    localStorage.setItem("sonicgpt_conversation_id", state.conversationId);
    return state.conversationId;
}

async function sendMessage() {
    const text = els.textInput.value.trim();
    if (!text) return;

    els.textInput.value = "";
    els.sendBtn.disabled = true;
    
    const userBubble = addBubble("user", renderMarkdown(text));
    renderMath(userBubble);

    const statusEl = addBubble("status", "SonicGPT réfléchit...");

    try {
        const convId = await ensureConversation();
        const res = await fetch("/public/v1/conversations/" + convId + "/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text, stream: false, callerId: state.ownerId, webAccess: true, source: "web" })
        });

        if (!res.ok) throw new Error("Erreur serveur (" + res.status + ")");
        const data = await res.json();
        statusEl.remove();

        const botEl = addBubble("bot", renderMarkdown(data.content || ""));
        setTimeout(() => renderMath(botEl), 50);
        
        if (data.media && data.media.length > 0) {
            data.media.forEach(m => {
                if (m.mediaType === "image") {
                    const img = document.createElement("img");
                    img.src = "data:" + m.mimeType + ";base64," + m.base64;
                    botEl.appendChild(img);
                }
            });
        }
    } catch (e) {
        statusEl.remove();
        addBubble("bot", "❌ " + escapeHtml(e.message), "error-bubble");
    } finally {
        els.sendBtn.disabled = false;
        els.textInput.focus();
    }
}

function bindEvents() {
    els.sendBtn.addEventListener("click", sendMessage);
    els.textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
    els.resetBtn.addEventListener("click", () => {
        localStorage.removeItem("sonicgpt_conversation_id");
        state.conversationId = null;
        els.messages.innerHTML = "";
    });
    els.attachBtn.addEventListener("click", () => els.fileInput.click());
}

function boot() {
    initOwner();
    bindEvents();
    els.textInput.focus();
}

window.addEventListener("load", boot);
</script>
</body>
</html>`;
}

module.exports = { renderChatPage };