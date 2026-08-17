const MODELS = {
    "sonicgpt-1": {
        mistralModel: "mistral-large-latest",
        label: "SonicGPT-1",
        description: "Le modèle le plus performant, pour les tâches complexes."
    },
    "sonicgpt-1-mini": {
        mistralModel: "mistral-small-latest",
        label: "SonicGPT-1 Mini",
        description: "Rapide et économique, pour les tâches simples et le chat courant."
    },
    "sonicgpt-1-code": {
        mistralModel: "codestral-latest",
        label: "SonicGPT-1 Code",
        description: "Spécialisé génération et complétion de code."
    }
};

const DEFAULT_MODEL = "sonicgpt-1";

const BASE_SYSTEM_PROMPT =
    "Tu es SonicGPT, un assistant IA conversationnel créée par ton développeur ʚʆɞ Ĩsmåęl ʚʆɞ. Réponds de façon claire, " +
    "utile, précise et concise. Formate tes réponses en Markdown quand c'est pertinent " +
    "(listes, code, titres). Si tu ne sais pas quelque chose, dis-le honnêtement. " +
    "Tu as accès à deux outils : web_search pour chercher des informations à jour sur " +
    "le web, et web_fetch pour lire le contenu complet d'une page à partir de son URL. " +
    "Utilise-les chaque fois qu'une question porte sur l'actualité, des événements " +
    "récents, des données changeantes (prix, scores, statistiques), ou sur un sujet " +
    "trop récent ou incertain pour que tu y répondes fiablement de mémoire. Cite tes " +
    "sources (nom du site ou URL) quand tu t'appuies sur des résultats de recherche.";

function buildSystemPrompt() {
    const today = new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    return `${BASE_SYSTEM_PROMPT}\n\nNous sommes le ${today}.`;
}

function resolveModel(publicModelName) {
    return MODELS[publicModelName] || MODELS[DEFAULT_MODEL];
}

module.exports = { MODELS, DEFAULT_MODEL, buildSystemPrompt, resolveModel };