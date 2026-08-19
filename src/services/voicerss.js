const VOICERSS_URL = "https://api.voicerss.org/";

function getVoiceRssKey() {
    const key = process.env.VOICERSS_API_KEY;
    if (!key) {
        throw new Error("VOICERSS_KEY_MISSING");
    }
    return key;
}

async function generateVoice({ text, language = "fr-fr" }) {
    const apiKey = getVoiceRssKey();
    const params = new URLSearchParams({
        key: apiKey,
        hl: language,
        src: text,
        c: "MP3",
        f: "44khz_16bit_stereo"
    });

    const response = await fetch(`${VOICERSS_URL}?${params.toString()}`);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || contentType.startsWith("text/plain")) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`VOICERSS_ERROR: ${errorText.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { base64, mimeType: "audio/mpeg" };
}

module.exports = { generateVoice };
