const GENERATE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const EDIT_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";

function getCloudflareConfig() {
    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_API_TOKEN;
    if (!accountId || !apiToken) {
        throw new Error("CLOUDFLARE_KEY_MISSING");
    }
    return { accountId, apiToken };
}

async function generateImage({ prompt }) {
    const { accountId, apiToken } = getCloudflareConfig();
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${GENERATE_MODEL}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`CLOUDFLARE_ERROR_${response.status}: ${text.slice(0, 300)}`);
    }

    const json = await response.json();
    if (!json.success || !json.result?.image) {
        throw new Error(`CLOUDFLARE_NO_IMAGE: ${JSON.stringify(json.errors || json).slice(0, 200)}`);
    }

    return { base64: json.result.image, mimeType: "image/jpeg" };
}

async function editImage({ base64, mimeType, instruction }) {
    const { accountId, apiToken } = getCloudflareConfig();
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EDIT_MODEL}`;

    const buffer = Buffer.from(base64, "base64");
    const blob = new Blob([buffer], { type: mimeType || "image/jpeg" });

    const form = new FormData();
    form.append("prompt", instruction);
    form.append("input_image_0", blob, "input.jpg");

    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        body: form
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(`[cloudflare edit] Réponse ${response.status} :`, text.slice(0, 300));
        throw new Error(`CLOUDFLARE_EDIT_ERROR_${response.status}: ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    if (!json.success || !json.result?.image) {
        console.error("[cloudflare edit] Réponse inattendue :", JSON.stringify(json).slice(0, 300));
        throw new Error(`CLOUDFLARE_EDIT_NO_IMAGE: ${JSON.stringify(json.errors || json).slice(0, 200)}`);
    }

    return { base64: json.result.image, mimeType: "image/jpeg" };
}

module.exports = { generateImage, editImage };
