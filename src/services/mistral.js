const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildHeaders() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY manquant côté serveur.");
    }
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(body, maxRetries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify(body)
        });

        if (response.status !== 429) {
            return response;
        }

        const errText = await response.text().catch(() => "");
        lastError = new Error(`Groq API error 429: ${errText}`);

        if (attempt < maxRetries) {
            const waitMs = 1000 * (attempt + 1);
            console.error(`[groq] 429 reçu, nouvelle tentative dans ${waitMs}ms (essai ${attempt + 1}/${maxRetries})`);
            await sleep(waitMs);
        }
    }
    throw lastError;
}

async function completeMistralChat({ model, messages, temperature = 0.7, maxTokens = 1024 }) {
    const response = await fetchWithRetry({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    return {
        content: json.choices?.[0]?.message?.content || "",
        finishReason: json.choices?.[0]?.finish_reason || "stop",
        usage: json.usage || null
    };
}

async function streamMistralChat({ model, messages, temperature = 0.7, maxTokens = 1024, onDelta }) {
    const response = await fetchWithRetry({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
    });

    if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let finishReason = "stop";

    for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;

            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                const reason = json.choices?.[0]?.finish_reason;
                if (reason) finishReason = reason;
                if (delta) {
                    fullText += delta;
                    onDelta(delta);
                }
            } catch (e) {
                // ignore
            }
        }
    }

    return { content: fullText, finishReason };
}

async function callMistralOnce({ model, messages, tools, temperature = 0.7, maxTokens = 1024 }) {
    const body = { model, messages, temperature, max_tokens: maxTokens, stream: false };
    if (tools && tools.length) {
        body.tools = tools;
        body.tool_choice = "auto";
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

module.exports = { completeMistralChat, streamMistralChat, callMistralOnce };
