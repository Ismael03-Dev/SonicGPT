const STOPWORDS = {
    fr: ["le", "la", "les", "de", "un", "une", "est", "je", "tu", "vous", "et", "que", "pour", "avec", "pas", "ça", "il", "elle"],
    en: ["the", "is", "you", "are", "and", "that", "for", "with", "not", "it", "this", "what", "do", "does"],
    es: ["el", "la", "de", "que", "es", "un", "una", "y", "para", "con", "no", "tu", "yo", "esto"],
    pt: ["o", "a", "de", "que", "é", "um", "uma", "e", "para", "com", "não", "você", "isso"]
};

function detectLanguage(text) {
    if (!text) return "fr";
    if (/[\u0600-\u06FF]/.test(text)) return "ar";

    const words = text.toLowerCase().match(/[a-zà-ÿ]+/g) || [];
    if (words.length === 0) return "fr";

    const scores = { fr: 0, en: 0, es: 0, pt: 0 };
    for (const word of words) {
        for (const [lang, list] of Object.entries(STOPWORDS)) {
            if (list.includes(word)) scores[lang]++;
        }
    }

    let bestLang = "fr";
    let bestScore = -1;
    for (const [lang, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestLang = lang;
        }
    }
    return bestLang;
}

module.exports = { detectLanguage };
