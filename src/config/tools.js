const { tavilySearch, tavilyExtract } = require("../services/tavily");

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
        return { error: `Outil inconnu : ${name}` };
    } catch (e) {
        if (e.message === "TAVILY_KEY_MISSING") {
            return { error: "La recherche web n'est pas configurée côté serveur (TAVILY_API_KEY manquant)." };
        }
        return { error: `Échec de l'outil ${name} : ${e.message}` };
    }
}

module.exports = { TOOLS, executeTool };
