const EDITOR_URL = "https://azadx69x.is-a.dev/api/editor";

function isImageBuffer(buffer) {
    if (!buffer || buffer.length < 8) return false;
    const signatures = [
        [0xff, 0xd8, 0xff],
        [0x89, 0x50, 0x4e, 0x47],
        [0x47, 0x49, 0x46],
        [0x52, 0x49, 0x46, 0x46]
    ];
    return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte));
}

async function editImageViaUrl(imageUrl, prompt) {
    const params = new URLSearchParams({ url: imageUrl, prompt });
    
    
    const response = await fetch(`${EDITOR_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(60000)
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (response.ok && isImageBuffer(buffer)) {
        return { base64: buffer.toString("base64"), mimeType: "image/png" };
    }

    let json = null;
    try {
        json = JSON.parse(buffer.toString("utf8"));
    } catch (e) {
    }

    const nextUrl = json?.url || json?.image || json?.result || json?.data || json?.output;
    if (nextUrl && /^https?:\/\//i.test(String(nextUrl))) {
        const imgResponse = await fetch(nextUrl, {
            signal: AbortSignal.timeout(30000)
        });
        if (!imgResponse.ok) {
            throw new Error(`AZAD_EDIT_FOLLOWUP_ERROR_${imgResponse.status}`);
        }
        const imgArrayBuffer = await imgResponse.arrayBuffer();
        const imgBuffer = Buffer.from(imgArrayBuffer);
        if (isImageBuffer(imgBuffer)) {
            return { base64: imgBuffer.toString("base64"), mimeType: "image/png" };
        }
    }

    console.error("[azadEdit] Réponse inexploitable :", response.status, buffer.toString("utf8").slice(0, 300));
    throw new Error(`AZAD_EDIT_ERROR_${response.status}: ${json?.message || "réponse inattendue"}`);
}

module.exports = { editImageViaUrl };