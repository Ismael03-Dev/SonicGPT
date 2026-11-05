function renderChatPage() {
    var html = '<!DOCTYPE html>\n' +
    '<html lang="fr">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>SonicGPT</title>\n' +
    '<link rel="icon" type="image/jpeg" href="https://z-p3-cdn.fbsbx.com/v/t59.2708-21/885274190_1173039918622519_8580212649803707836_n.bin/file-1793814546610.bin?_nc_cat=103&ccb=1-7&_nc_sid=2b0e22&_nc_eui2=AeEXCduP0pKwsq73KIPJvpn2_ldEd7otEjz-V0R3ui0SPHW_DiOlZN5p2eRnpe7BYHWE3RqXYtZy3LUnpAw5iBkP&_nc_ohc=l3PdD39J2WIQ7kNvwEQNUPC&_nc_oc=AdpQu_Pkg-JT-dkI1ueTgYPlC8YUBcOCqZFOdYcva_KHXezDXpR_LA2JX-JwyPtQKFE&_nc_ad=z-m&_nc_cid=1400&_nc_zt=7&_nc_ht=z-p3-cdn.fbsbx.com&_nc_gid=k4mkU4OVhdY7J_TYmfK8fA&_nc_ss=7a338&oh=03_Q7cD6wFljDeR-LGHdTunDa7vKQgOjTuKHvGYZmhvJsynymGXHA&oe=6AED3B87&dl=1">\n' +
    '<style>\n' +
    ':root { --bg: #0f1117; --bg-soft: #1c1e29; --border: #23252e; --text: #e8e8ea; --text-muted: #9a9cb0; --accent: #7c5cff; --danger: #ff6b6b; }\n' +
    '* { box-sizing: border-box; }\n' +
    'body { margin: 0; font-family: sans-serif; background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; }\n' +
    'header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }\n' +
    '.brand h1 { font-size: 18px; margin: 0; color: var(--accent); }\n' +
    '#messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }\n' +
    '.bubble { max-width: 85%; padding: 4px 0; line-height: 1.6; font-size: 15px; word-wrap: break-word; }\n' +
    '.user { align-self: flex-end; background: var(--accent); color: white; padding: 10px 16px; border-radius: 18px; border-bottom-right-radius: 4px; }\n' +
    '.bot { align-self: flex-start; background: transparent; padding: 4px 0; }\n' +
    '.error-bubble { border-left: 3px solid var(--danger); padding-left: 10px; }\n' +
    '.status { align-self: flex-start; color: #7a7d94; font-size: 13px; font-style: italic; }\n' +
    '#inputBar { display: flex; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--border); flex-shrink: 0; align-items: center; }\n' +
    '#textInput { flex: 1; background: var(--bg-soft); border: 1px solid var(--border); color: var(--text); padding: 12px 16px; border-radius: 12px; font-size: 15px; outline: none; }\n' +
    '.iconBtn { background: var(--bg-soft); border: 1px solid var(--border); color: var(--text-muted); width: 42px; height: 42px; border-radius: 12px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\n' +
    '#sendBtn { background: var(--accent); border: none; color: white; padding: 0 20px; height: 42px; border-radius: 12px; cursor: pointer; font-size: 15px; flex-shrink: 0; }\n' +
    '#sendBtn:disabled { opacity: 0.5; cursor: default; }\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<header><div class="brand"><h1>SonicGPT</h1></div><button id="resetBtn" style="background:none;border:1px solid #35374a;color:#9a9cb0;padding:6px 12px;border-radius:8px;cursor:pointer;">Réinitialiser</button></header>\n' +
    '<div id="messages"></div>\n' +
    '<div id="inputBar">\n' +
    '<input type="file" id="fileInput" accept="image/*" style="display:none">\n' +
    '<button class="iconBtn" id="attachBtn">📎</button>\n' +
    '<input id="textInput" type="text" placeholder="Écris à SonicGPT...">\n' +
    '<button id="sendBtn">Envoyer</button>\n' +
    '</div>\n' +
    '<script>\n' +
    'var messagesEl = document.getElementById("messages");\n' +
    'var textInput = document.getElementById("textInput");\n' +
    'var sendBtn = document.getElementById("sendBtn");\n' +
    'var resetBtn = document.getElementById("resetBtn");\n' +
    'var attachBtn = document.getElementById("attachBtn");\n' +
    'var fileInput = document.getElementById("fileInput");\n' +
    'var conversationId = localStorage.getItem("sonicgpt_conversation_id");\n' +
    'var ownerId = localStorage.getItem("sonicgpt_owner_id");\n' +
    'if (!ownerId) {\n' +
    '    ownerId = "web-" + Date.now();\n' +
    '    localStorage.setItem("sonicgpt_owner_id", ownerId);\n' +
    '}\n' +
    'function addMessage(role, text) {\n' +
    '    var el = document.createElement("div");\n' +
    '    el.className = "bubble " + role;\n' +
    '    el.textContent = text;\n' +
    '    messagesEl.appendChild(el);\n' +
    '    messagesEl.scrollTop = messagesEl.scrollHeight;\n' +
    '    return el;\n' +
    '}\n' +
    'async function ensureConv() {\n' +
    '    if (conversationId) return conversationId;\n' +
    '    var res = await fetch("/public/v1/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "sonicgpt-1", ownerId: ownerId }) });\n' +
    '    if (!res.ok) throw new Error("Erreur création");\n' +
    '    var data = await res.json();\n' +
    '    conversationId = data.id;\n' +
    '    localStorage.setItem("sonicgpt_conversation_id", conversationId);\n' +
    '    return conversationId;\n' +
    '}\n' +
    'async function envoyer() {\n' +
    '    var text = textInput.value.trim();\n' +
    '    if (!text) return;\n' +
    '    textInput.value = "";\n' +
    '    sendBtn.disabled = true;\n' +
    '    addMessage("user", text);\n' +
    '    var statusEl = addMessage("status", "SonicGPT réfléchit...");\n' +
    '    try {\n' +
    '        var convId = await ensureConv();\n' +
    '        var res = await fetch("/public/v1/conversations/" + convId + "/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text, stream: false, callerId: ownerId, webAccess: true, source: "web" }) });\n' +
    '        if (!res.ok) throw new Error("Erreur serveur (" + res.status + ")");\n' +
    '        var data = await res.json();\n' +
    '        statusEl.remove();\n' +
    '        var botEl = addMessage("bot", data.content || "");\n' +
    '        if (data.media && data.media.length > 0) {\n' +
    '            data.media.forEach(function(m) {\n' +
    '                if (m.mediaType === "image") {\n' +
    '                    var img = document.createElement("img");\n' +
    '                    img.src = "data:" + m.mimeType + ";base64," + m.base64;\n' +
    '                    img.style.maxWidth = "260px";\n' +
    '                    img.style.borderRadius = "10px";\n' +
    '                    img.style.display = "block";\n' +
    '                    img.style.marginTop = "6px";\n' +
    '                    botEl.appendChild(img);\n' +
    '                }\n' +
    '            });\n' +
    '        }\n' +
    '    } catch (e) {\n' +
    '        statusEl.remove();\n' +
    '        addMessage("bot error-bubble", "❌ " + e.message);\n' +
    '    } finally {\n' +
    '        sendBtn.disabled = false;\n' +
    '        textInput.focus();\n' +
    '    }\n' +
    '}\n' +
    'sendBtn.onclick = envoyer;\n' +
    'textInput.onkeydown = function(e) { if (e.key === "Enter") envoyer(); };\n' +
    'resetBtn.onclick = function() {\n' +
    '    localStorage.removeItem("sonicgpt_conversation_id");\n' +
    '    conversationId = null;\n' +
    '    messagesEl.innerHTML = "";\n' +
    '};\n' +
    'attachBtn.onclick = function() { fileInput.click(); };\n' +
    'fileInput.onchange = function() {\n' +
    '    var file = fileInput.files[0];\n' +
    '    if (!file) return;\n' +
    '    alert("Fichier sélectionné : " + file.name);\n' +
    '};\n' +
    '<\/script>\n' +
    '</body>\n' +
    '</html>';
    return html;
}
module.exports = { renderChatPage };