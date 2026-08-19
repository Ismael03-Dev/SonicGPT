const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getGeminiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_KEY_MISSING");
    }
    return key;
}

async function callGemini(parts) {
    const apiKey = getGeminiKey();
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`GEMINI_ERROR_${response.status}: ${text.slice(0, 300)}`);
    }

    const json = await response.json();
    const responseParts = json.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find(p => p.inlineData || p.inline_data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline) {
        const textPart = responseParts.find(p => p.text);
        throw new Error(`GEMINI_NO_IMAGE: ${textPart?.text?.slice(0, 200) || "réponse sans image"}`);
    }

    return {
        base64: inline.data,
        mimeType: inline.mimeType || inline.mime_type || "image/png"
    };
}

async function generateImage({ prompt }) {
    return callGemini([{ text: prompt }]);
}

async function editImage({ base64, mimeType, instruction }) {
    return callGemini([
        { text: instruction },
        { inlineData: { mimeType: mimeType || "image/png", data: base64 } }
    ]);
}

module.exports = { generateImage, editImage };
