const TTS_BASE_URL = "https://text.pollinations.ai";
const ALLOWED_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

async function generateVoice({ text, voice = "nova" }) {
    const safeVoice = ALLOWED_VOICES.includes(voice) ? voice : "nova";
    const params = new URLSearchParams();
    params.set("model", "openai-audio");
    params.set("voice", safeVoice);

    const encodedText = encodeURIComponent(text);
    const url = `${TTS_BASE_URL}/${encodedText}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`POLLINATIONS_TTS_ERROR_${response.status}: ${errorText.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { base64, mimeType: "audio/mpeg" };
}

module.exports = { generateVoice };
