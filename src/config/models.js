// Modèles "SonicGPT" exposés publiquement, mappés en interne vers les
// modèles Mistral réels. Ça te permet de changer de modèle sous-jacent
// sans jamais casser l'API publique de tes clients.
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

const SYSTEM_PROMPT =
    "Tu es SonicGPT, un assistant IA conversationnel créé par ton développeur ʚʆɞ Ĩsmåęl ʚʆɞ. Réponds de façon claire, " +
    "utile, précise et concise. Formate tes réponses en Markdown quand c'est pertinent " +
    "(listes, code, titres). Si tu ne sais pas quelque chose, dis-le honnêtement.";

function resolveModel(publicModelName) {
    return MODELS[publicModelName] || MODELS[DEFAULT_MODEL];
}

module.exports = { MODELS, DEFAULT_MODEL, SYSTEM_PROMPT, resolveModel };
