const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_URL = "https://api.imgbb.com/1/upload";

async function uploadBase64ToUrl(base64, mimeType = "image/jpeg") {
    if (!base64) throw new Error("UPLOAD_NO_BASE64");
    if (!IMGBB_API_KEY) throw new Error("IMGBB_KEY_MISSING");

    let cleanBase64 = base64;
    if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
    }

    const buffer = Buffer.from(cleanBase64, "base64");
    const blob = new Blob([buffer], { type: mimeType });

    const form = new FormData();
    form.append("image", blob, `sonic_${Date.now()}.jpg`);
    form.append("expiration", "300");

    const response = await fetch(`${IMGBB_URL}?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: form
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`UPLOAD_ERROR_${response.status}: ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    if (!json.success || !json.data?.url) {
        throw new Error(`UPLOAD_BAD_RESPONSE: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return json.data.url;
}

module.exports = { uploadBase64ToUrl };