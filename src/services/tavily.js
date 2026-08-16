const TAVILY_API_URL = "https://api.tavily.com";

function getTavilyKey() {
    const key = process.env.TAVILY_API_KEY;
    if (!key) {
        throw new Error("TAVILY_KEY_MISSING");
    }
    return key;
}

async function tavilySearch(query) {
    const apiKey = getTavilyKey();
    const response = await fetch(`${TAVILY_API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            query,
            max_results: 5,
            search_depth: "basic",
            include_answer: false
        })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`TAVILY_ERROR_${response.status}: ${text}`);
    }

    const json = await response.json();
    return {
        results: (json.results || []).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
            publishedDate: r.published_date || null
        }))
    };
}

async function tavilyExtract(url) {
    const apiKey = getTavilyKey();
    const response = await fetch(`${TAVILY_API_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ urls: [url] })
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`TAVILY_ERROR_${response.status}: ${text}`);
    }

    const json = await response.json();
    const result = (json.results || [])[0];
    if (!result) {
        return { error: "Impossible d'extraire le contenu de cette page." };
    }
    return {
        url: result.url,
        content: (result.raw_content || "").slice(0, 6000)
    };
}

module.exports = { tavilySearch, tavilyExtract };
