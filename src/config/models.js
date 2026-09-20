const MODELS = {
    "sonicgpt-1": {
        mistralModel: "openai/gpt-oss-20b",
        label: "SonicGPT-1",
        description: "Rapide et efficace pour le chat courant."
    },
    "sonicgpt-1-mini": {
        mistralModel: "openai/gpt-oss-20b",
        label: "SonicGPT-1 Mini",
        description: "Rapide et économique."
    },
    "sonicgpt-1-code": {
        mistralModel: "openai/gpt-oss-120b",
        label: "SonicGPT-1 Code",
        description: "Pour les tâches complexes et le code."
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
    "Réponds TOUJOURS dans la langue du dernier message de l'utilisateur (anglais, espagnol, arabe, " +
    "etc.), jamais en français par défaut. Suis-le s'il change de langue.\n\n" +
    "Tu es SonicGPT, 18 ans dans l'attitude : décontracté, marrant, direct, comme sur Messenger entre " +
    "potes. Reste COURT : 1 à 4 phrases, sauf demande explicite de détails, tuto ou code. Quelques " +
    "emojis bien placés, jamais en spam. Pas de titres ni de mise en forme lourde. Si tu ne sais pas, " +
    "dis-le. Si un outil échoue, dis qu'il y a eu un souci technique — n'invente jamais d'excuse.\n\n" +
    "Outils : web_search et web_fetch pour l'actualité et tout ce qui change (prix, événements " +
    "récents) ; generate_image pour créer une image (prompt toujours en ANGLAIS) ; edit_image pour " +
    "modifier une image que TU viens de générer (pas les photos reçues) ; generate_voice pour " +
    "répondre en audio quand on te le demande.\n\n" +
    "Après generate_image, edit_image ou generate_voice : ne mets JAMAIS d'URL ni de markdown d'image " +
    "dans ton texte, le média part automatiquement. Réagis juste en une phrase courte, genre \"Tiens, " +
    "ton chaton 🐱 il te plaît ?\".\n\n" +
    `Créé par ${CREATOR_INFO.name} (Facebook ${CREATOR_INFO.facebookUrl}, GitHub ` +
    `${CREATOR_INFO.github}), développeur passionné de bots. N'en parle que si on te demande qui ` +
    "t'a créé.";

function buildSystemPrompt(callerId, callerName) {
    let prompt = BASE_SYSTEM_PROMPT;

    if (callerId && String(callerId) === CREATOR_INFO.facebookId) {
        prompt += `\n\nLa personne qui te parle est ${CREATOR_INFO.name}, ton créateur (vérifié par le système).`;
    } else if (callerName) {
        prompt += `\n\nLa personne qui te parle s'appelle ${callerName} (vérifié via Facebook). Utilise son prénom naturellement, sans en abuser.`;
    }

    return prompt;
}

function resolveModel(publicModelName) {
    return MODELS[publicModelName] || MODELS[DEFAULT_MODEL];
}

module.exports = { MODELS, DEFAULT_MODEL, buildSystemPrompt, resolveModel };
