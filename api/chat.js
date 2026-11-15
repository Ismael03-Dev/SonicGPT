export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const SECRET = process.env.COPILOT_SECRET || "ismael04-lag-developper";
  const auth = req.headers["authorization"] || "";
  if (auth !== `Bearer ${SECRET}`) return res.status(403).json({ error: "Accès refusé" });

  try {
    const { messages, model, max_tokens, temperature } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages requis" });

    // 👇 Ici tu branches ce que tu veux : OpenRouter, Gemini, Groq, local…
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://sonic-gpt.vercel.app",
        "X-Title": "Sonic-GPT"
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
        messages,
        max_tokens: max_tokens || 4096,
        temperature: temperature ?? 0.3
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(data);

    // Format unifié : { reply: "..." }
    const reply = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply, raw: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}