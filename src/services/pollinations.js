const IMAGE_BASE_URL = "https://image.pollinations.ai/prompt";
const TTS_BASE_URL = "https://text.pollinations.ai";

const QUALITY_SUFFIX = ", high quality, detailed, sharp focus, professional";

function buildImageUrl({ prompt, width = 1280, height = 1280, model = "flux", seed, boostQuality = true }) {
    const params = new URLSearchParams();
    params.set("width", width);
    params.set("height", height);
    params.set("model", model);
    params.set("nologo", "true");
    params.set("safe", "true");
    params.set("private", "true");
    params.set("enhance", "true");
    if (seed !== undefined && seed !== null) {
        params.set("seed", seed);
    }

    const finalPrompt = boostQuality ? `${prompt}${QUALITY_SUFFIX}` : prompt;
    const encodedPrompt = encodeURIComponent(finalPrompt);
    return `${IMAGE_BASE_URL}/${encodedPrompt}?${params.toString()}`;
}

function buildAudioUrl({ text, voice = "nova" }) {
    const allowedVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const safeVoice = allowedVoices.includes(voice) ? voice : "nova";
    const params = new URLSearchParams();
    params.set("model", "openai-audio");
    params.set("voice", safeVoice);

    const encodedText = encodeURIComponent(text);
    return `${TTS_BASE_URL}/${encodedText}?${params.toString()}`;
}

module.exports = { buildImageUrl, buildAudioUrl };
