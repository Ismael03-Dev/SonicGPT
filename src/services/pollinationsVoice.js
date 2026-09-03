const TTS_BASE_URL = "https://text.pollinations.ai";
const ALLOWED_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

async function generateVoice({ text, voice = "nova" }) {
    const safeVoice = ALLOWED_VOICES.includes(voice) ? voice : "nova";
    const params = new URLSearchParams();
    params.set("model", "openai-audio");
    params.set("voice", safeVoice);

    const encodedText = encodeURIComponent(text);
    const url = `${TTS_BASE_URL}/${encodedText}?${params.toString()}`;

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        console.error("[pollinationsVoice] Échec réseau vers Pollinations TTS :", e.message);
        throw new Error(`POLLINATIONS_TTS_NETWORK_ERROR: ${e.message}`);
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`[pollinationsVoice] Réponse ${response.status} de Pollinations :`, errorText.slice(0, 300));
        throw new Error(`POLLINATIONS_TTS_ERROR_${response.status}: ${errorText.slice(0, 200)}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("audio/")) {
        const bodyText = await response.text().catch(() => "");
        console.error(`[pollinationsVoice] Content-Type inattendu (${contentType}) :`, bodyText.slice(0, 300));
        throw new Error(`POLLINATIONS_TTS_UNEXPECTED_CONTENT_TYPE: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { base64, mimeType: "audio/mpeg" };
}

module.exports = { generateVoice };
