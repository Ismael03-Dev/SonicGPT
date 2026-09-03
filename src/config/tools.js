const { tavilySearch, tavilyExtract } = require("../services/tavily");
const { generateImage } = require("../services/cloudflare");
const { generateVoice } = require("../services/pollinationsVoice");

const TOOLS = [
    {
        type: "function",
        function: {
            name: "web_search",
            description:
                "Recherche des informations à jour sur le web. À utiliser pour toute question sur " +
                "l'actualité, des événements récents, des prix, des données changeantes, ou tout ce " +
                "que tu ne peux pas connaître avec certitude à partir de tes seules connaissances.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "La requête de recherche, dans la langue la plus adaptée au sujet."
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "web_fetch",
            description: "Récupère et lit le contenu texte complet d'une page web à partir de son URL exacte.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "L'URL complète de la page à lire, incluant https://"
                    }
                },
                required: ["url"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_image",
            description:
                "Génère une image à partir d'une description textuelle et la montre à l'utilisateur. " +
                "Utilise cet outil chaque fois qu'on te demande une image, un dessin, une illustration, " +
                "ou chaque fois que ça a du sens naturellement dans la conversation.",
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "Description détaillée de l'image, de préférence en anglais pour de meilleurs résultats."
                    }
                },
                required: ["prompt"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_voice",
            description:
                "Convertit du texte en message vocal audio et l'envoie à l'utilisateur. Utilise cet " +
                "outil quand on te demande explicitement de parler, répondre en vocal, en audio, ou " +
                "avec une voix.",
            parameters: {
                type: "object",
                properties: {
                    text: {
                        type: "string",
                        description: "Le texte à convertir en voix, dans la langue de la conversation."
                    }
                },
                required: ["text"]
            }
        }
    }
];

async function executeTool(name, rawArgs) {
    let args = {};
    try {
        args = JSON.parse(rawArgs || "{}");
    } catch (e) {
        return { error: "Arguments d'outil invalides." };
    }

    try {
        if (name === "web_search") {
            if (!args.query) return { error: "Le paramètre 'query' est requis." };
            return await tavilySearch(args.query);
        }
        if (name === "web_fetch") {
            if (!args.url) return { error: "Le paramètre 'url' est requis." };
            return await tavilyExtract(args.url);
        }
        if (name === "generate_image") {
            if (!args.prompt) return { error: "Le paramètre 'prompt' est requis." };
            const result = await generateImage({ prompt: args.prompt });
            return { type: "image", base64: result.base64, mimeType: result.mimeType, prompt: args.prompt };
        }
        if (name === "generate_voice") {
            if (!args.text) return { error: "Le paramètre 'text' est requis." };
            const result = await generateVoice({ text: args.text });
            return { type: "audio", base64: result.base64, mimeType: result.mimeType, text: args.text };
        }
        return { error: `Outil inconnu : ${name}` };
    } catch (e) {
        console.error(`[executeTool] Échec réel de l'outil ${name} :`, e.message, e.stack ? e.stack.split("\n")[0] : "");
        if (e.message === "TAVILY_KEY_MISSING") {
            return { error: "La recherche web n'est pas configurée côté serveur (TAVILY_API_KEY manquant)." };
        }
        if (e.message === "CLOUDFLARE_KEY_MISSING") {
            return { error: "La génération d'image n'est pas configurée côté serveur (CF_ACCOUNT_ID/CF_API_TOKEN manquant)." };
        }
        return { error: `Échec de l'outil ${name} : ${e.message}` };
    }
}

module.exports = { TOOLS, executeTool };
