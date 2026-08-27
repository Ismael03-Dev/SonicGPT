const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function chunkText(text, wordsPerChunk = 6) {
    const words = text.split(" ");
    const chunks = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        const isLast = i + wordsPerChunk >= words.length;
        chunks.push(words.slice(i, i + wordsPerChunk).join(" ") + (isLast ? "" : " "));
    }
    return chunks;
}

async function simulateStream(text, onChunk, delayMs = 12) {
    if (!text) return;
    const chunks = chunkText(text, 10);
    for (const chunk of chunks) {
        onChunk(chunk);
        await sleep(delayMs);
    }
}

module.exports = { simulateStream };
