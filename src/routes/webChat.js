function renderChatPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SonicGPT</title>
<link rel="icon" type="image/jpeg" href="https://i.imgur.com/PeWYQV.jpeg">
<meta property="og:title" content="SonicGPT">
<meta property="og:description" content="Discute avec SonicGPT, l'IA qui cherche sur le web, voit tes images et te répond en vocal.">
<meta property="og:image" content="https://i.imgur.com/PeWYQV.jpeg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:image" content="https://i.imgur.com/PeWYQV.jpeg">
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
        flex-shrink: 0;
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
        scroll-behavior: smooth;
    }
    .bubble {
        max-width: 75%;
        padding: 10px 14px;
        border-radius: 14px;
        line-height: 1.45;
        font-size: 14px;
        word-wrap: break-word;
        animation: fadeIn 0.15s ease-out;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
    }
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
    .user { align-self: flex-end; background: #7c5cff; color: white; border-bottom-right-radius: 4px; }
    .bot { align-self: flex-start; background: #1c1e29; border-bottom-left-radius: 4px; }
    .status { align-self: flex-start; color: #7a7d94; font-size: 12px; font-style: italic; display: flex; align-items: center; gap: 6px; }
    .dots { display: inline-flex; gap: 3px; }
    .dots span {
        width: 5px; height: 5px; border-radius: 50%; background: #7a7d94;
        animation: bounce 1.2s infinite ease-in-out;
    }
    .dots span:nth-child(2) { animation-delay: 0.15s; }
    .dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }
    .bubble img { max-width: 260px; border-radius: 10px; display: block; margin-top: 6px; cursor: pointer; }
    .bubble audio { margin-top: 6px; width: 240px; }
    .preview {
        display: flex; align-items: center; gap: 10px; padding: 8px 20px;
        border-top: 1px solid #23252e; background: #14151d;
    }
    .preview img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
    .preview span { font-size: 12px; color: #9a9cb0; flex: 1; }
    .preview button { background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 16px; }
    #inputBar {
        display: flex;
        gap: 8px;
        padding: 14px 20px;
        border-top: 1px solid #23252e;
        flex-shrink: 0;
        align-items: center;
    }
    #inputBar input[type="text"] {
        flex: 1;
        background: #1c1e29;
        border: 1px solid #2c2e3a;
        color: #e8e8ea;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 14px;
        outline: none;
    }
    #inputBar input[type="text"]:focus { border-color: #7c5cff; }
    .iconBtn {
        background: #1c1e29;
        border: 1px solid #2c2e3a;
        color: #9a9cb0;
        width: 38px; height: 38px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
    }
    .iconBtn:hover { border-color: #7c5cff; color: #e8e8ea; }
    .iconBtn.recording { background: #ff4d4d; border-color: #ff4d4d; color: white; animation: pulse 1s infinite; }
    @keyframes pulse { 50% { opacity: 0.6; } }
    #sendBtn {
        background: #7c5cff;
        border: none;
        color: white;
        padding: 0 18px;
        height: 38px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        flex-shrink: 0;
    }
    #sendBtn:disabled { opacity: 0.5; cursor: default; }
    #messages::-webkit-scrollbar { width: 6px; }
    #messages::-webkit-scrollbar-thumb { background: #2c2e3a; border-radius: 3px; }
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
    <button class="iconBtn" id="micBtn" title="Message vocal">🎤</button>
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
const micBtn = document.getElementById("micBtn");
const previewBar = document.getElementById("previewBar");
const previewImg = document.getElementById("previewImg");
const previewLabel = document.getElementById("previewLabel");
const previewRemove = document.getElementById("previewRemove");

let ownerId = localStorage.getItem("sonicgpt_owner_id");
let conversationId = localStorage.getItem("sonicgpt_conversation_id");
let pendingImage = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

if (!ownerId) {
    ownerId = "web-" + crypto.randomUUID();
    localStorage.setItem("sonicgpt_owner_id", ownerId);
}

textInput.focus();

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function renderMarkdown(text) {
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, (m, code) => "<pre><code>" + code.trim() + "</code></pre>");
    escaped = escaped.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
    escaped = escaped.replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/(?<!\\*)\\*([^*]+)\\*(?!\\*)/g, "<em>$1</em>");
    const paragraphs = escaped.split(/\\n\\n+/).map(p => "<p>" + p.replace(/\\n/g, "<br>") + "</p>");
    return paragraphs.join("");
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
    el.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>' + escapeHtml(text);
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

attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const base64 = await blobToBase64(file);
    pendingImage = { base64, mimeType: file.type };
    previewImg.src = "data:" + file.type + ";base64," + base64;
    previewLabel.textContent = file.name;
    previewBar.style.display = "flex";
    fileInput.value = "";
});

previewRemove.addEventListener("click", () => {
    pendingImage = null;
    previewBar.style.display = "none";
});

let pendingAudioBlob = null;
let audioContext = null;
let analyser = null;
let waveformFrame = null;
let recordStream = null;

function startWaveform(canvas) {
    const ctx = canvas.getContext("2d");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(recordStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        waveformFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
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
    if (waveformFrame) cancelAnimationFrame(waveformFrame);
    if (audioContext) audioContext.close().catch(() => {});
    waveformFrame = null;
    audioContext = null;
    analyser = null;
}

micBtn.addEventListener("click", async () => {
    if (isRecording) {
        mediaRecorder.stop();
        return;
    }
    try {
        recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(recordStream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            isRecording = false;
            micBtn.classList.remove("recording");
            micBtn.textContent = "🎤";
            stopWaveform();
            recordStream.getTracks().forEach(t => t.stop());
            previewBar.querySelector("canvas")?.remove();

            pendingAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
            previewImg.style.display = "none";
            previewLabel.textContent = "🎙️ Message vocal prêt (" + (pendingAudioBlob.size / 1024).toFixed(0) + " Ko)";
            previewBar.style.display = "flex";
        };
        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add("recording");
        micBtn.textContent = "⏹";

        previewImg.style.display = "none";
        previewLabel.textContent = "";
        const canvas = document.createElement("canvas");
        canvas.width = 140;
        canvas.height = 30;
        previewLabel.after(canvas);
        previewBar.style.display = "flex";
        startWaveform(canvas);
    } catch (e) {
        addBubble("bot", "❌ Impossible d'accéder au micro : " + escapeHtml(e.message));
    }
});

previewRemove.addEventListener("click", () => {
    pendingImage = null;
    pendingAudioBlob = null;
    previewBar.querySelector("canvas")?.remove();
    previewImg.style.display = "";
    previewBar.style.display = "none";
});

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
        textInput.value = data.text;
        await sendMessage();
    } catch (e) {
        statusEl.remove();
        addBubble("bot", "❌ " + escapeHtml(e.message));
    }
}

async function sendMessage() {
    const text = textInput.value.trim();
    if (!text && !pendingImage && !pendingAudioBlob) return;

    if (pendingAudioBlob) {
        const blob = pendingAudioBlob;
        pendingAudioBlob = null;
        previewBar.querySelector("canvas")?.remove();
        previewImg.style.display = "";
        previewBar.style.display = "none";
        sendBtn.disabled = true;
        await sendAudioMessage(blob);
        sendBtn.disabled = false;
        return;
    }

    const image = pendingImage;
    pendingImage = null;
    previewBar.style.display = "none";
    textInput.value = "";
    sendBtn.disabled = true;

    let userBubbleHtml = text ? renderMarkdown(text) : "";
    const userBubble = addBubble("user", userBubbleHtml || "&nbsp;");
    if (image) addMedia(userBubble, "image", image.base64, image.mimeType);

    const statusEl = addStatus("SonicGPT réfléchit...");

    try {
        const convId = await ensureConversation();
        const payload = { content: text, stream: true, callerId: ownerId };
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
                    statusEl.lastChild.textContent = "🛠️ " + json.tool + "...";
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
    await fetch("/public/v1/conversations/" + conversationId, {
        method: "DELETE"
    }).catch(() => {});
    localStorage.removeItem("sonicgpt_conversation_id");
    conversationId = null;
    messagesEl.innerHTML = "";
});
</script>
</body>
</html>`;
}

module.exports = { renderChatPage };
