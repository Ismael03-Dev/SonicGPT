```markdown
# SonicGPT API

Backend d'IA conversationnelle propulsé par Groq et Mistral, avec une interface web intégrée, un support complet de la vision (analyse d'images), de la génération et de l'édition d'images, ainsi que de la voix (synthèse et transcription). Le tout est accessible via une API compatible avec le format OpenAI.

## Fonctionnalités

- Chat conversationnel avec mémoire de 5 minutes par utilisateur.
- Vision : le modèle peut analyser les images que l'utilisateur envoie.
- Génération d'images : création d'images à partir de descriptions textuelles (via Cloudflare Workers AI).
- Édition d'images : modification d'images existantes (via une API tierce).
- Synthèse vocale : le bot peut répondre en audio (via Edge TTS).
- Transcription audio : le bot peut comprendre les messages vocaux (via Cloudflare STT).
- Accès web : le modèle peut chercher des informations en ligne (via Tavily).
- Interface Web : une page de chat complète, accessible directement à la racine du site.

## Stack Technique

- Node.js + Express : serveur HTTP.
- Turso (libSQL) : base de données serverless pour stocker les conversations.
- Groq : moteur d'inférence pour le chat et la vision (modèles gpt-oss et qwen).
- Cloudflare Workers AI : génération d'images (FLUX).
- API tierce : édition d'images.
- Edge TTS : synthèse vocale.
- Tavily : recherche web.
- Vercel : hébergement serverless.

## Installation locale

1. Cloner le dépôt
   ```bash
   git clone https://github.com/Ismael03-Dev/SonicGPT
   cd SonicGPT
```

2. Installer les dépendances
   ```bash
   npm install
   ```
3. Configurer les variables d'environnement
   ```bash
   cp .env.example .env
   ```
   Remplis les variables dans .env (voir la section Variables d'environnement ci-dessous).
4. Lancer le serveur
   ```bash
   npm run dev
   ```
   Le serveur sera accessible sur http://localhost:3000.

Variables d'environnement

Variable Description Requis
TURSO_DATABASE_URL URL de la base Turso Oui
TURSO_AUTH_TOKEN Token d'authentification Turso Oui
GROQ_API_KEY Clé API Groq (pour le chat et la vision) Oui
CF_ACCOUNT_ID ID de compte Cloudflare (pour la génération d'images) Oui
CF_API_TOKEN Token API Cloudflare Oui
TAVILY_API_KEY Clé API Tavily (pour la recherche web) Recommandé
IMGBB_API_KEY Clé API ImgBB (pour l'hébergement temporaire avant édition) Recommandé
SONICGPT_API_KEY Clé secrète pour authentifier les requêtes API Oui

Endpoints de l'API

Route compatible OpenAI (stateless)

POST /v1/chat/completions
Permet d'utiliser SonicGPT comme n'importe quel modèle OpenAI, sans gestion de conversation côté serveur.

Routes avec conversations persistées

· POST /v1/conversations : crée une nouvelle conversation.
· GET /v1/conversations : liste les conversations (filtre par ownerId).
· GET /v1/conversations/:id : récupère l'historique d'une conversation.
· DELETE /v1/conversations/:id : supprime une conversation.
· POST /v1/conversations/:id/messages : envoie un message et reçoit la réponse (supporte le SSE).

Routes média

· POST /v1/images/generations : génère une image.
· POST /v1/images/edit : modifie une image.
· POST /v1/voice/generations : génère un message vocal.
· POST /v1/audio/transcriptions : transcrit un fichier audio.

Interface Web

Une interface de chat complète est disponible à la racine du site (/). Elle permet de :

· Discuter avec SonicGPT.
· Envoyer des images pour analyse.
· Générer et éditer des images.
· Enregistrer et envoyer des messages vocaux.

Sécurité

· Ne jamais exposer GROQ_API_KEY ou CF_API_TOKEN côté client. Elles sont utilisées uniquement dans les variables d'environnement du serveur.
· Rate limiting : le middleware publicRateLimit protège les routes publiques (/public/v1/*).
· Modération : il est recommandé d'ajouter un filtre de contenu si l'application est ouverte au public.

Tests

Pour tester l'API, tu peux utiliser curl :

```bash
curl -X POST https://ton-projet.vercel.app/v1/conversations \
  -H "Authorization: Bearer TA_CLE_SONICGPT" \
  -H "Content-Type: application/json" \
  -d '{"model": "sonicgpt-1", "ownerId": "user_123"}'
```

Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

Auteur

Ismael (https://github.com/Ismael03-Dev)

```