const CATBOX_URL = "https://catbox.moe/user/api.php";

async function uploadBase64ToUrl(base64, mimeType = "image/jpeg") {
    if (!base64) throw new Error("UPLOAD_NO_BASE64");

    const buffer = Buffer.from(base64, "base64");
    const ext = (mimeType || "image/jpeg").split("/")[1] || "jpg";
    const filename = `sonicgpt_${Date.now()}.${ext}`;

    const blob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", blob, filename);

    const response = await fetch(CATBOX_URL, {
        method: "POST",
        body: form
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`UPLOAD_ERROR_${response.status}: ${text.slice(0, 200)}`);
    }

    const url = (await response.text()).trim();
    if (!/^https?:\/\//i.test(url)) {
        throw new Error(`UPLOAD_BAD_RESPONSE: ${url.slice(0, 200)}`);
    }
    return url;
}

module.exports = { uploadBase64ToUrl };