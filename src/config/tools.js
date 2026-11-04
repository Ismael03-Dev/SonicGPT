const { tavilySearch, tavilyExtract } = require("../services/tavily");
const { generateImage } = require("../services/cloudflare");
const { editImageViaUrl } = require("../services/azadEdit");
const { uploadBase64ToUrl } = require("../services/imageHost");
const { generateVoice } = require("../services/ttsEdge");

const TOOLS = [
    {
        type: "function",
        function: {
            name: "web_search",
            description: "Recherche des informations à jour sur le web. À utiliser pour toute question sur l'actualité, des événements récents, des prix, des données changeantes, ou tout ce que tu ne peux pas connaître avec certitude à partir de tes seules connaissances.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "La requête de recherche." }
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
                    url: { type: "string", description: "L'URL complète de la page à lire." }
                },
                required: ["url"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_image",
            description: "Génère une image à partir d'une description textuelle et la montre à l'utilisateur.",
            parameters: {
                type: "object",
                properties: {
                    prompt: { type: "string", description: "Description détaillée de l'image en anglais." }
                },
                required: ["prompt"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "edit_image",
            description: "Modifie la dernière image de la conversation à partir d'une consigne texte.",
            parameters: {
                type: "object",
                properties: {
                    instruction: { type: "string", description: "Description de la modification." }
                },
                required: ["instruction"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_voice",
            description: "Convertit du texte en message vocal audio et l'envoie à l'utilisateur.",
            parameters: {
                type: "object",
                properties: {
                    text: { type: "string", description: "Le texte à convertir." },
                    lang: { type: "string", description: "Code langue (fr, en, es, ar...)." }
                },
                required: ["text", "lang"]
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
            const result = await generateImage({ prompt: args.prompt });
            return { type: "image", base64: result.base64, mimeType: result.mimeType, prompt: args.prompt };
        }
        if (name === "edit_image") {
            if (!args.instruction) return { error: "Le paramètre 'instruction' est requis." };

            if (context.lastImageUrl) {
                const result = await editImageViaUrl(context.lastImageUrl, args.instruction);
                return { type: "image", base64: result.base64, mimeType: result.mimeType, prompt: args.instruction };
            }

            if (context.lastImageBase64) {
                const hostedUrl = await uploadBase64ToUrl(context.lastImageBase64, context.lastImageMimeType || "image/jpeg");
                const result = await editImageViaUrl(hostedUrl, args.instruction);
                return { type: "image", base64: result.base64, mimeType: result.mimeType, prompt: args.instruction };
            }

            return { error: "Aucune image récente à modifier." };
        }
        if (name === "generate_voice") {
            if (!args.text) return { error: "Le paramètre 'text' est requis." };
            const result = await generateVoice({ text: args.text, lang: args.lang });
            return { type: "audio", base64: result.base64, mimeType: result.mimeType, text: args.text };
        }
        return { error: `Outil inconnu : ${name}` };
    } catch (e) {
        console.error(`[executeTool] Échec de l'outil ${name} :`, e.message);
        if (e.message === "TAVILY_KEY_MISSING") {
            return { error: "La recherche web n'est pas configurée." };
        }
        if (e.message === "CLOUDFLARE_KEY_MISSING") {
            return { error: "La génération d'image n'est pas configurée." };
        }
        if (e.message.startsWith("UPLOAD_")) {
            return { error: `Impossible d'héberger l'image pour l'édition : ${e.message}` };
        }
        if (e.message.startsWith("AZAD_EDIT_")) {
            return { error: `L'éditeur d'image a échoué : ${e.message}` };
        }
        return { error: `Échec de l'outil ${name} : ${e.message}` };
    }
}

module.exports = { TOOLS, executeTool };