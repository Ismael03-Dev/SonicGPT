export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const SECRET = process.env.COPILOT_SECRET || "ismael04-lag-developper";
  if ((req.headers["authorization"] || "") !== `Bearer ${SECRET}`)
    return res.status(403).json({ error: "Accès refusé" });

  try {
    const { messages, model, max_tokens, temperature } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages requis" });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY manquante" });

    const contents = messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    const systemMsg = messages.find(m => m.role === "system");
    const systemInstruction = systemMsg
      ? { parts: [{ text: systemMsg.content }] }
      : undefined;

    const geminiModel = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          temperature: temperature ?? 0.3,
          maxOutputTokens: max_tokens || 8192
        }
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(data);

    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";

    if (!reply.trim()) {
      const finishReason = data.candidates?.[0]?.finishReason || "inconnu";
      return res.status(500).json({ error: `Réponse Gemini vide (finishReason: ${finishReason})` });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}