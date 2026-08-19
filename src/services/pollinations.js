const IMAGE_BASE_URL = "https://image.pollinations.ai/prompt";
const TTS_BASE_URL = "https://text.pollinations.ai";
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const IMAGE_MODELS = {
    flux: "flux",
    flux_2: "flux-2",
    flux_3: "flux-3",
    turbo: "turbo",
    any: "any"
};

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

function buildImageUrl({ prompt, width = 1024, height = 1024, model = "flux", seed, enhance = true }) {
    const params = new URLSearchParams();
    params.set("width", width);
    params.set("height", height);
    params.set("model", model);
    params.set("nologo", "true");
    params.set("safe", "true");
    params.set("private", "true");
    if (seed !== undefined && seed !== null) {
        params.set("seed", seed);
    }
    if (enhance) {
        params.set("enhance", "true");
    }
    params.set("quality", "high");

    let finalPrompt = prompt;
    if (!prompt.match(/(4k|8k|high quality|detailed|ultra|hq)/i)) {
        finalPrompt = `${prompt}, 4k, high quality, detailed, ultra realistic`;
    }

    const encodedPrompt = encodeURIComponent(finalPrompt);
    return `${IMAGE_BASE_URL}/${encodedPrompt}?${params.toString()}`;
}

function buildAudioUrl({ text, voice = "nova", speed = 1.0 }) {
    const safeVoice = VOICES.includes(voice) ? voice : "nova";
    const params = new URLSearchParams();
    params.set("model", "openai-audio");
    params.set("voice", safeVoice);
    params.set("speed", speed);
    const encodedText = encodeURIComponent(text);
    return `${TTS_BASE_URL}/${encodedText}?${params.toString()}`;
}

async function downloadImage(url) {
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        if (!response.data || response.data.length < 1000) {
            throw new Error("Image vide ou corrompue");
        }

        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const imgPath = path.join(tempDir, `pollinations_${Date.now()}.png`);
        fs.writeFileSync(imgPath, response.data);
        return imgPath;
    } catch (err) {
        console.error("[pollinations] Erreur téléchargement image:", err.message);
        return null;
    }
}

async function downloadAudio(url) {
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        if (!response.data || response.data.length < 1000) {
            throw new Error("Audio vide ou corrompu");
        }

        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const audioPath = path.join(tempDir, `pollinations_audio_${Date.now()}.mp3`);
        fs.writeFileSync(audioPath, response.data);
        return audioPath;
    } catch (err) {
        console.error("[pollinations] Erreur téléchargement audio:", err.message);
        return null;
    }
}

async function generateAndDownloadImage({ prompt, width = 1024, height = 1024, model = "flux", seed, enhance = true }) {
    const url = buildImageUrl({ prompt, width, height, model, seed, enhance });
    return await downloadImage(url);
}

async function generateAndDownloadAudio({ text, voice = "nova", speed = 1.0 }) {
    const url = buildAudioUrl({ text, voice, speed });
    return await downloadAudio(url);
}

module.exports = {
    buildImageUrl,
    buildAudioUrl,
    downloadImage,
    downloadAudio,
    generateAndDownloadImage,
    generateAndDownloadAudio,
    IMAGE_MODELS,
    VOICES
};