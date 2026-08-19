const EDIT_API_URL = "https://craft-api-dreams.lovable.app/api/edit-image";

function extractUrlFromResponse(json) {
    return (
        json.url ||
        json.imageUrl ||
        json.image ||
        json.output ||
        json.data?.url ||
        json.data?.imageUrl ||
        json.data?.image ||
        null
    );
}

async function editImage({ imageUrl, instruction }) {
    const response = await fetch(EDIT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            imageUrl,
            image: imageUrl,
            prompt: instruction,
            instruction
        })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`EDIT_API_ERROR_${response.status}: ${text.slice(0, 300)}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.startsWith("image/")) {
        return { url: response.url };
    }

    const json = await response.json().catch(() => null);
    if (!json) {
        throw new Error("EDIT_API_INVALID_RESPONSE");
    }

    const url = extractUrlFromResponse(json);
    if (!url) {
        console.error("[imageEdit] Réponse inattendue de craft-api-dreams :", JSON.stringify(json).slice(0, 500));
        throw new Error("EDIT_API_NO_URL_FOUND");
    }

    return { url };
}

module.exports = { editImage };
