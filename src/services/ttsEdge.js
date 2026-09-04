const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const MALE_VOICES = {
    fr: "fr-FR-HenriNeural",
    en: "en-US-GuyNeural",
    es: "es-ES-AlvaroNeural",
    pt: "pt-BR-AntonioNeural",
    ar: "ar-SA-HamedNeural",
    de: "de-DE-ConradNeural",
    it: "it-IT-DiegoNeural"
};

function resolveVoice(lang) {
    const code = (lang || "fr").toLowerCase().slice(0, 2);
    return MALE_VOICES[code] || MALE_VOICES.fr;
}

async function generateVoice({ text, lang }) {
    const voiceName = resolveVoice(lang);
    const tts = new MsEdgeTTS();

    try {
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    } catch (e) {
        console.error("[ttsEdge] Échec setMetadata :", e.message);
        throw new Error(`EDGE_TTS_SETUP_ERROR: ${e.message}`);
    }

    let audioStream;
    try {
        const result = await tts.toStream(text);
        audioStream = result.audioStream;
    } catch (e) {
        console.error("[ttsEdge] Échec toStream :", e.message);
        throw new Error(`EDGE_TTS_STREAM_INIT_ERROR: ${e.message}`);
    }

    const chunks = [];
    return new Promise((resolve, reject) => {
        audioStream.on("data", (chunk) => chunks.push(chunk));
        audioStream.on("close", () => {
            const buffer = Buffer.concat(chunks);
            resolve({ base64: buffer.toString("base64"), mimeType: "audio/mpeg" });
        });
        audioStream.on("error", (e) => {
            console.error("[ttsEdge] Échec du flux audio :", e.message);
            reject(new Error(`EDGE_TTS_STREAM_ERROR: ${e.message}`));
        });
    });
}

module.exports = { generateVoice };
