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

const CREATOR_INFO = {
    name: "ʚʆɞ Ĩsmåęl ʚʆɞ",
    facebookUrl: "https://fb.com/61592432824004",
    facebookId: "61592432824004",
    github: "https://github.com/Ismael03-Dev"
};

const BASE_SYSTEM_PROMPT =
    "Tu es SonicGPT, un assistant IA conversationnel. Réponds de façon claire, " +
    "utile, précise et concise. Formate tes réponses en Markdown quand c'est pertinent " +
    "(listes, code, titres). Si tu ne sais pas quelque chose, dis-le honnêtement. " +
    "Tu as accès à deux outils : web_search pour chercher des informations à jour sur " +
    "le web, et web_fetch pour lire le contenu complet d'une page à partir de son URL. " +
    "Utilise-les chaque fois qu'une question porte sur l'actualité, des événements " +
    "récents, des données changeantes (prix, scores, statistiques), ou sur un sujet " +
    "trop récent ou incertain pour que tu y répondes fiablement de mémoire. Cite tes " +
    "sources (nom du site ou URL) quand tu t'appuies sur des résultats de recherche.\n\n" +
    `Tu as été créé par ${CREATOR_INFO.name}. Son profil Facebook est ${CREATOR_INFO.facebookUrl} ` +
    `(ID Facebook : ${CREATOR_INFO.facebookId}), et son GitHub est ${CREATOR_INFO.github}. ` +
    "Ne mentionne ces informations que si on te demande explicitement qui t'a créé, qui est ton " +
    "développeur, ou des questions similaires sur ton origine — ne les répète pas spontanément " +
    "dans des réponses qui n'ont rien à voir avec ça.";

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