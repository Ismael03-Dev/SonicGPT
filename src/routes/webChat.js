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
        display: flex;
        flex-direction: column;
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
        transition: border-color 0.15s, color 0.15s;
    }
    #resetBtn:hover { border-color: var(--accent); color: var(--text); }

    #messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scroll-behavior: smooth;
    }
    #messages::-webkit-scrollbar { width: 6px; }
    #messages::-webkit-scrollbar-thumb { background: var(--border-soft); border-radius: 3px; }

    .bubble {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 14px;
        line-height: 1.5;
        font-size: 14px;
        word-wrap: break-word;
        animation: fadeIn 0.15s ease-out;
        overflow-x: auto;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .bubble p { margin: 0 0 8px 0; }
    .bubble p:last-child { margin-bottom: 0; }
    .bubble code {
        background: rgba(255,255,255,0.08);
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 13px;
        font-family: "SF Mono", Consolas, monospace;
    }
    .bubble pre {
        background: #0a0b10;
        padding: 10px 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 6px 0;
    }
    .bubble pre code { background: none; padding: 0; }
    .bubble img { max-width: 260px; border-radius: 10px; display: block; margin-top: 6px; cursor: pointer; }
    .bubble audio { margin-top: 6px; width: 240px; }
    .bubble .katex-display { margin: 10px 0; overflow-x: auto; overflow-y: hidden; }
    
    .user { align-self: flex-end; background: var(--accent); color: white; border-bottom-right-radius: 4px; }
    .bot { align-self: flex-start; background: var(--bg-soft); border-bottom-left-radius: 4px; }
    .error-bubble { border-left: 3px solid var(--danger); }

    .status {
        align-self: flex-start;
        color: #7a7d94;
        font-size: 12px;
        font-style: italic;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .dots { display: inline-flex; gap: 3px; }
    .dots span {
        width: 5px; height: 5px; border-radius: 50%; background: #7a7d94;
        animation: bounce 1.2s infinite ease-in-out;
    }
    .dots span:nth-child(2) { animation-delay: 0.15s; }
    .dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }

    .preview {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 20px;
        border-top: 1px solid var(--border);
        background: var(--bg-elev);
    }
    .preview img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
    .preview span { font-size: 12px; color: var(--text-muted); flex: 1; }
    .preview button { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 16px; }

    #inputBar {
        display: flex;
        gap: 8px;
        padding: 14px 20px;
        border-top: 1px solid var(--border);
        flex-shrink: 0;
        align-items: center;
    }
    #textInput {
        flex: 1;
        background: var(--bg-soft);
        border: 1px solid var(--border-soft);
        color: var(--text);
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
    }
    #textInput:focus { border-color: var(--accent); }
    .iconBtn {
        background: var(--bg-soft);
        border: 1px solid var(--border-soft);
        color: var(--text-muted);
        width: 38px; height: 38px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: border-color 0.15s, color 0.15s;
    }
    .iconBtn:hover { border-color: var(--accent); color: var(--text); }
    .iconBtn.recording { background: #ff4d4d; border-color: #ff4d4d; color: white; animation: pulse 1s infinite; }
    @keyframes pulse { 50% { opacity: 0.6; } }
    #sendBtn {
        background: var(--accent);
        border: none;
        color: white;
        padding: 0 18px;
        height: 38px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        flex-shrink: 0;
        transition: opacity 0.15s;
    }
    #sendBtn:disabled { opacity: 0.5; cursor: default; }
</style>
</head>
<body>

<header id="mainHeader">
    <div class="brand">
        <img src="https://z-p3-cdn.fbsbx.com/v/t59.2708-21/885274190_1173039918622519_8580212649803707836_n.bin/file-1793814546610.bin?_nc_cat=103&ccb=1-7&_nc_sid=2b0e22&_nc_eui2=AeEXCduP0pKwsq73KIPJvpn2_ldEd7otEjz-V0R3ui0SPHW_DiOlZN5p2eRnpe7BYHWE3RqXYtZy3LUnpAw5iBkP&_nc_ohc=l3PdD39J2WIQ7kNvwEQNUPC&_nc_oc=AdpQu_Pkg-JT-dkI1ueTgYPlC8YUBcOCqZFOdYcva_KHXezDXpR_LA2JX-JwyPtQKFE&_nc_ad=z-m&_nc_cid=1400&_nc_zt=7&_nc_ht=z-p3-cdn.fbsbx.com&_nc_gid=k4mkU4OVhdY7J_TYmfK8fA&_nc_ss=7a338&oh=03_Q7cD6wFljDeR-LGHdTunDa7vKQgOjTuKHvGYZmhvJsynymGXHA&oe=6AED3B87&dl=1" alt="SonicGPT">
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
    <button class="iconBtn" id="micBtn" title="Message vocal">🎤</button>
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
    fileInput: document.getElementById("fileInput"),
    micBtn: document.getElementById("micBtn"),
    previewBar: document.getElementById("previewBar"),
    previewImg: document.getElementById("previewImg"),
    previewLabel: document.getElementById("previewLabel"),
    previewRemove: document.getElementById("previewRemove")
};

const state = {
    ownerId: null,
    conversationId: null,
    pendingImage: null,
    pendingAudioBlob: null,
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    audioContext: null,
    analyser: null,
    waveformFrame: null,
    recordStream: null
};

function initOwner() {
    let ownerId = localStorage.getItem("sonicgpt_owner_id");
    if (!ownerId) {
        ownerId = "web-" + crypto.randomUUID();
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
    const paragraphs = escaped.split(/\n\n+/).map(p => "<p>" + p.replace(/\n/g, "<br>") + "</p>");
    return paragraphs.join("");
}

// Fonction pour rendre les maths avec KaTeX (avec vérification de chargement)
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
    } else {
        // Si le script n'est pas encore chargé, on réessaie dans 300ms
        setTimeout(() => renderMath(element), 300);
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

function addErrorBubble(text) {
    return addBubble("bot", escapeHtml(text), "error-bubble");
}

function addStatus(text) {
    const el = document.createElement("div");
    el.className = "status";
    el.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>' + escapeHtml(text);
    els.messages.appendChild(el);
    els.messages.scrollTop = els.messages.scrollHeight;
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
    els.messages.scrollTop = els.messages.scrollHeight;
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function ensureConversation() {
    if (state.conversationId) return state.conversationId;
    const res = await fetch("/public/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "sonicgpt-1", ownerId: state.ownerId })
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error("Création de la conversation impossible (" + res.status + ") " + text.slice(0, 80));
    }
    const data = await res.json();
    state.conversationId = data.id;
    localStorage.setItem("sonicgpt_conversation_id", state.conversationId);
    return state.conversationId;
}

async function sendAudioMessage(blob) {
    const statusEl = addStatus("Transcription du vocal...");
    try {
        const base64 = await blobToBase64(blob);
        const res = await fetch("/public/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64 })
        });
        if (!res.ok) throw new Error("Transcription impossible.");
        const data = await res.json();
        statusEl.remove();
        els.textInput.value = data.text;
        await sendMessage();
    } catch (e) {
        statusEl.remove();
        addErrorBubble("❌ " + e.message);
    }
}

async function sendMessage() {
    const text = els.textInput.value.trim();
    if (!text && !state.pendingImage && !state.pendingAudioBlob) return;

    if (state.pendingAudioBlob) {
        const blob = state.pendingAudioBlob;
        state.pendingAudioBlob = null;
        els.previewBar.querySelector("canvas")?.remove();
        els.previewImg.style.display = "";
        els.previewBar.style.display = "none";
        els.sendBtn.disabled = true;
        await sendAudioMessage(blob);
        els.sendBtn.disabled = false;
        return;
    }

    const image = state.pendingImage;
    state.pendingImage = null;
    els.previewBar.style.display = "none";
    els.textInput.value = "";
    els.sendBtn.disabled = true;

    const userBubble = addBubble("user", text ? renderMarkdown(text) : "&nbsp;");
    if (text) renderMath(userBubble);
    if (image) addMedia(userBubble, "image", image.base64, image.mimeType);

    const statusEl = addStatus("SonicGPT réfléchit...");

    try {
        const convId = await ensureConversation();
        const payload = { content: text, stream: false, callerId: state.ownerId, webAccess: true, source: "web" };
        if (image) {
            payload.imageBase64 = image.base64;
            payload.imageMimeType = image.mimeType;
        }

        const res = await fetch("/public/v1/conversations/" + convId + "/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error("Erreur serveur (" + res.status + ")" + (errText ? " : " + errText.slice(0, 80) : ""));
        }

        const data = await res.json();
        statusEl.remove();

        const botBubble = addBubble("bot", "");
        if (data.content) {
            botBubble.innerHTML = renderMarkdown(data.content);
            renderMath(botBubble);
        }
        if (data.media && data.media.length > 0) {
            for (const m of data.media) addMedia(botBubble, m.mediaType, m.base64, m.mimeType);
        }
    } catch (e) {
        if (statusEl.parentNode) statusEl.remove();
        addErrorBubble("❌ " + e.message);
    } finally {
        els.sendBtn.disabled = false;
        els.textInput.focus();
    }
}

function resetConversationUI() {
    localStorage.removeItem("sonicgpt_conversation_id");
    state.conversationId = null;
    els.messages.innerHTML = "";
}

async function handleReset() {
    if (!state.conversationId) { resetConversationUI(); return; }
    await fetch("/public/v1/conversations/" + state.conversationId, { method: "DELETE" }).catch(() => {});
    resetConversationUI();
}

function handleFileSelect() {
    const file = els.fileInput.files[0];
    if (!file) return;
    blobToBase64(file).then(base64 => {
        state.pendingImage = { base64, mimeType: file.type };
        els.previewImg.src = "data:" + file.type + ";base64," + base64;
        els.previewLabel.textContent = file.name;
        els.previewBar.style.display = "flex";
        els.fileInput.value = "";
    });
}

function clearPreview() {
    state.pendingImage = null;
    state.pendingAudioBlob = null;
    els.previewBar.querySelector("canvas")?.remove();
    els.previewImg.style.display = "";
    els.previewBar.style.display = "none";
}

function startWaveform(canvas) {
    const ctx = canvas.getContext("2d");
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = state.audioContext.createMediaStreamSource(state.recordStream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    source.connect(state.analyser);
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        state.waveformFrame = requestAnimationFrame(draw);
        state.analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = "#7c5cff";
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }
    draw();
}

function stopWaveform() {
    if (state.waveformFrame) cancelAnimationFrame(state.waveformFrame);
    if (state.audioContext) state.audioContext.close().catch(() => {});
    state.waveformFrame = null;
    state.audioContext = null;
    state.analyser = null;
}

async function toggleRecording() {
    if (state.isRecording) {
        state.mediaRecorder.stop();
        return;
    }
    try {
        state.recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(state.recordStream);
        state.audioChunks = [];
        state.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) state.audioChunks.push(e.data); };
        state.mediaRecorder.onstop = () => {
            state.isRecording = false;
            els.micBtn.classList.remove("recording");
            els.micBtn.textContent = "🎤";
            stopWaveform();
            state.recordStream.getTracks().forEach(t => t.stop());
            els.previewBar.querySelector("canvas")?.remove();

            state.pendingAudioBlob = new Blob(state.audioChunks, { type: "audio/webm" });
            els.previewImg.style.display = "none";
            els.previewLabel.textContent = "🎙️ Message vocal prêt (" + (state.pendingAudioBlob.size / 1024).toFixed(0) + " Ko)";
            els.previewBar.style.display = "flex";
        };
        state.mediaRecorder.start();
        state.isRecording = true;
        els.micBtn.classList.add("recording");
        els.micBtn.textContent = "⏹";

        els.previewImg.style.display = "none";
        els.previewLabel.textContent = "";
        const canvas = document.createElement("canvas");
        canvas.width = 140;
        canvas.height = 30;
        els.previewLabel.after(canvas);
        els.previewBar.style.display = "flex";
        startWaveform(canvas);
    } catch (e) {
        addErrorBubble("❌ Impossible d'accéder au micro : " + e.message);
    }
}

function bindEvents() {
    els.sendBtn.addEventListener("click", sendMessage);
    els.textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
    els.resetBtn.addEventListener("click", handleReset);
    els.attachBtn.addEventListener("click", () => els.fileInput.click());
    els.fileInput.addEventListener("change", handleFileSelect);
    els.micBtn.addEventListener("click", toggleRecording);
    els.previewRemove.addEventListener("click", clearPreview);
}

function boot() {
    initOwner();
    bindEvents();
    els.textInput.focus();
}

boot();
</script>
</body>
</html>`;
}

module.exports = { renderChatPage };