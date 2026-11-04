const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildHeaders() {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY manquant.");
    return { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(body, maxRetries = 1) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(GROQ_API_URL, { method: "POST", headers: buildHeaders(), body: JSON.stringify(body) });
        if (response.status !== 429 && response.status !== 503) return response;
        const errText = await response.text().catch(() => "");
        lastError = new Error(`Groq API error ${response.status}: ${errText}`);
        if (attempt < maxRetries) {
            let waitMs = 2000 * Math.pow(2, attempt);
            const retryAfter = response.headers.get("retry-after");
            if (retryAfter) {
                const parsed = parseFloat(retryAfter);
                if (!isNaN(parsed)) waitMs = Math.max(waitMs, parsed * 1000 + 500);
            }
            await sleep(waitMs);
        }
    }
    throw lastError;
}

async function callMistralOnce({ model, messages, tools, toolChoice = "auto", temperature = 0.7, maxTokens = 1024 }) {
    const body = { model, messages, temperature, max_tokens: maxTokens, stream: false };
    if (tools && tools.length) {
        body.tools = tools;
        body.tool_choice = toolChoice;
    }

    const response = await fetchWithRetry(body);
    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const choice = json.choices?.[0];
    return {
        message: choice?.message || {},
        finishReason: choice?.finish_reason || "stop",
        usage: json.usage || null
    };
}

module.exports = { callMistralOnce };