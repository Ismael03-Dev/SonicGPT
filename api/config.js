export default async function handler(req, res) {
  const SECRET = process.env.COPILOT_SECRET || "ismael04-lag-developper";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "x-api-key, content-type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.query?.ping === "true")
    return res.status(200).json({ status: "online", timestamp: new Date().toISOString() });

  const token = req.headers["x-api-key"] || req.query?.key;
  if (!token || token !== SECRET) return res.status(403).json({ error: "Accès refusé" });

  return res.status(200).json({
    github: {
      username: process.env.GH_USERNAME || "Ismael03-Dev",
      repo: process.env.GH_REPO || "HedgehogGPT",
      branch: process.env.GH_BRANCH || "main",
      token: process.env.GH_TOKEN
    },
    sonic: {
      url: "https://sonic-gpt.vercel.app",
      key: SECRET,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    },
    allowed: ["61593588167628"]
  });
}