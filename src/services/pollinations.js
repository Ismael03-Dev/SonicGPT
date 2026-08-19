const IMAGE_BASE_URL = "https://image.pollinations.ai/prompt";
const TTS_BASE_URL = "https://text.pollinations.ai";

function buildImageUrl({ prompt, width = 1024, height = 1024, model = "flux", seed }) {
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

    const encodedPrompt = encodeURIComponent(prompt);
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