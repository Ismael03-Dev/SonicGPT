const { tavilySearch, tavilyExtract } = require("../services/tavily");
const { buildImageUrl, buildAudioUrl } = require("../services/pollinations");
const { editImage } = require("../services/imageEdit");

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
                    },
                    voice: {
                        type: "string",
                        description: "Voix à utiliser. Par défaut nova.",
                        enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
                    }
                },
                required: ["text"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "edit_image",
            description:
                "Modifie une image existante à partir d'une consigne texte (par exemple : ajoute un " +
                "chapeau, change le fond, rends-la en style peinture...). Si aucune URL n'est fournie, " +
                "modifie automatiquement la dernière image générée dans cette conversation. Utilise cet " +
                "outil quand on te demande de modifier, retoucher, éditer ou changer une image déjà " +
                "montrée.",
            parameters: {
                type: "object",
                properties: {
                    instruction: {
                        type: "string",
                        description: "Description de la modification à apporter à l'image."
                    },
                    imageUrl: {
                        type: "string",
                        description: "URL de l'image à modifier. Omets ce champ pour éditer la dernière image générée dans la conversation."
                    }
                },
                required: ["instruction"]
            }
        }
    }
];

async function executeTool(name, rawArgs, context = {}) {
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
            const url = buildImageUrl({ prompt: args.prompt });
            return { type: "image", url, prompt: args.prompt };
        }
        if (name === "generate_voice") {
            if (!args.text) return { error: "Le paramètre 'text' est requis." };
            const url = buildAudioUrl({ text: args.text, voice: args.voice });
            return { type: "audio", url, text: args.text };
        }
        if (name === "edit_image") {
            if (!args.instruction) return { error: "Le paramètre 'instruction' est requis." };
            const targetUrl = args.imageUrl || context.lastImageUrl;
            if (!targetUrl) {
                return { error: "Aucune image récente à modifier. Génère d'abord une image, ou donne une URL." };
            }
            const result = await editImage({ imageUrl: targetUrl, instruction: args.instruction });
            return { type: "image", url: result.url, prompt: args.instruction };
        }
        return { error: `Outil inconnu : ${name}` };
    } catch (e) {
        if (e.message === "TAVILY_KEY_MISSING") {
            return { error: "La recherche web n'est pas configurée côté serveur (TAVILY_API_KEY manquant)." };
        }
        return { error: `Échec de l'outil ${name} : ${e.message}` };
    }
}

module.exports = { TOOLS, executeTool };
