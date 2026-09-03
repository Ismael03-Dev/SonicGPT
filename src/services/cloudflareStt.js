const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";

function getCloudflareConfig() {
    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_API_TOKEN;
    if (!accountId || !apiToken) {
        throw new Error("CLOUDFLARE_KEY_MISSING");
    }
    return { accountId, apiToken };
}

async function transcribeAudio({ base64 }) {
    const { accountId, apiToken } = getCloudflareConfig();
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${WHISPER_MODEL}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ audio: base64 })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(`[cloudflareStt] Réponse ${response.status} :`, text.slice(0, 300));
        throw new Error(`CLOUDFLARE_STT_ERROR_${response.status}: ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    if (!json.success || !json.result?.text) {
        console.error("[cloudflareStt] Réponse inattendue :", JSON.stringify(json).slice(0, 300));
        throw new Error(`CLOUDFLARE_STT_NO_TEXT: ${JSON.stringify(json.errors || json).slice(0, 200)}`);
    }

    return { text: json.result.text };
}

module.exports = { transcribeAudio };
