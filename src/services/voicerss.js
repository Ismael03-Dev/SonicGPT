const VOICERSS_URLS = ["http://api.voicerss.org/", "https://api.voicerss.org/"];

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

    let lastNetworkError = null;

    for (const baseUrl of VOICERSS_URLS) {
        try {
            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const contentType = response.headers.get("content-type") || "";

            if (!response.ok || contentType.startsWith("text/plain")) {
                const errorText = await response.text().catch(() => "");
                throw new Error(`VOICERSS_ERROR: ${errorText.slice(0, 200)}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            return { base64, mimeType: "audio/mpeg" };
        } catch (e) {
            if (e.message && e.message.startsWith("VOICERSS_ERROR")) {
                throw e;
            }
            lastNetworkError = e;
        }
    }

    throw new Error(`VOICERSS_NETWORK_ERROR: ${lastNetworkError?.message || "connexion impossible"}`);
}

module.exports = { generateVoice };
