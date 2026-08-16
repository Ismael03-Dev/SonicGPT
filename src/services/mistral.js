const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

function buildHeaders() {
    if (!process.env.MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY manquant côté serveur.");
    }
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
    };
}

// Appel non-streaming : renvoie le texte complet + les infos d'usage.
async function completeMistralChat({ model, messages, temperature = 0.7, maxTokens = 1024 }) {
    const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: false
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Mistral API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    return {
        content: json.choices?.[0]?.message?.content || "",
        finishReason: json.choices?.[0]?.finish_reason || "stop",
        usage: json.usage || null
    };
}

// Appel streaming : appelle onDelta(chunkText) à chaque morceau reçu.
// Renvoie le texte complet accumulé une fois le flux terminé.
async function streamMistralChat({ model, messages, temperature = 0.7, maxTokens = 1024, onDelta }) {
    const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true
        })
    });

    if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Mistral API error ${response.status}: ${errText}`);
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let finishReason = "stop";

    for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // dernier morceau potentiellement incomplet, gardé pour le prochain tour

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
                // morceau JSON malformé/partiel, on l'ignore silencieusement
            }
        }
    }

    return { content: fullText, finishReason };
}

module.exports = { completeMistralChat, streamMistralChat };
