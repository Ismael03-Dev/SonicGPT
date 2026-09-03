const TTS_ENDPOINT = "https://translate.google.com/translate_tts";
const MAX_CHUNK_LENGTH = 200;

function chunkForTts(text, maxLen = MAX_CHUNK_LENGTH) {
    if (text.length <= maxLen) return [text];
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let current = "";
    for (const sentence of sentences) {
        if ((current + sentence).length > maxLen) {
            if (current) chunks.push(current.trim());
            current = sentence.length > maxLen ? sentence.slice(0, maxLen) : sentence;
        } else {
            current += sentence;
        }
    }
    if (current) chunks.push(current.trim());
    return chunks;
}

async function fetchChunk(text, lang) {
    const url = `${TTS_ENDPOINT}?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

    let response;
    try {
        response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
    } catch (e) {
        console.error("[googleTts] Échec réseau :", e.message);
        throw new Error(`GOOGLE_TTS_NETWORK_ERROR: ${e.message}`);
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`[googleTts] Réponse ${response.status} :`, errorText.slice(0, 300));
        throw new Error(`GOOGLE_TTS_ERROR_${response.status}: ${errorText.slice(0, 200)}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("audio/")) {
        const bodyText = await response.text().catch(() => "");
        console.error(`[googleTts] Content-Type inattendu (${contentType}) :`, bodyText.slice(0, 300));
        throw new Error(`GOOGLE_TTS_UNEXPECTED_CONTENT_TYPE: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function generateVoice({ text, lang = "fr" }) {
    const chunks = chunkForTts(text);
    const buffers = [];
    for (const chunk of chunks) {
        const buffer = await fetchChunk(chunk, lang);
        buffers.push(buffer);
    }
    const combined = Buffer.concat(buffers);
    return { base64: combined.toString("base64"), mimeType: "audio/mpeg" };
}

module.exports = { generateVoice };
