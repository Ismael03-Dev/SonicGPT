# SonicGPT API

Backend d'IA conversationnelle, propulsé par Mistral AI, avec une interface propre
(format proche d'OpenAI) pour que n'importe quel client (site web, app mobile, bot) puisse
discuter avec "SonicGPT" — streaming des réponses inclus, comme ChatGPT ou Claude.

## Stack

- **Node.js + Express**
- **Turso (libSQL)** — persistance des conversations, compatible serverless/Vercel
- **Mistral AI** comme moteur, appelé côté serveur uniquement (ta clé Mistral n'est jamais exposée)

## 1. Créer la base Turso

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create sonicgpt
turso db show sonicgpt --url        # -> TURSO_DATABASE_URL
turso db tokens create sonicgpt     # -> TURSO_AUTH_TOKEN
```

Le schéma (`conversations`, `messages`) se crée automatiquement au premier appel.

## 2. Configuration

```bash
cp .env.example .env
```

Remplis dans `.env` :
- `MISTRAL_API_KEY` — ta clé prise sur [console.mistral.ai](https://console.mistral.ai/api-keys)
- `SONICGPT_API_KEY` — une clé que **tu inventes toi-même** (longue chaîne aléatoire), c'est celle que tes utilisateurs/clients utiliseront pour appeler ton API. Génère-en une avec `openssl rand -hex 32`.
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`

```bash
npm install
npm run dev
# -> http://localhost:3000
```

## 3. Déploiement sur Vercel

```bash
npm i -g vercel
vercel
```

Ajoute les mêmes variables d'environnement dans Settings → Environment Variables sur le dashboard Vercel, puis :

```bash
vercel --prod
```

## Authentification

Toutes les routes `/v1/*` demandent ta clé `SONICGPT_API_KEY` :

```
Authorization: Bearer ta-cle-sonicgpt
```

(ou header `x-api-key` en alternative)

## Modèles disponibles

| Nom public | Modèle Mistral sous-jacent | Usage |
|---|---|---|
| `sonicgpt-1` | `mistral-large-latest` | Le plus performant |
| `sonicgpt-1-mini` | `mistral-small-latest` | Rapide, économique |
| `sonicgpt-1-code` | `codestral-latest` | Génération de code |

`GET /v1/models` renvoie cette liste au format JSON.

## Route A — Compatible OpenAI (stateless)

Pour un usage classique façon ChatGPT/Claude API : le client garde l'historique et le renvoie à chaque appel.

```bash
curl https://ton-projet.vercel.app/v1/chat/completions \
  -H "Authorization: Bearer ta-cle-sonicgpt" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonicgpt-1",
    "messages": [{"role": "user", "content": "Salut, tu es qui ?"}],
    "stream": false
  }'
```

Avec `"stream": true`, la réponse est envoyée en Server-Sent Events (SSE), morceau par morceau, format identique à celui d'OpenAI (`data: {...}\n\n`, terminé par `data: [DONE]\n\n`).

## Route B — Conversations persistées (recommandé pour une vraie app de chat)

```bash
# 1. Créer une conversation
curl -X POST https://ton-projet.vercel.app/v1/conversations \
  -H "Authorization: Bearer ta-cle-sonicgpt" \
  -H "Content-Type: application/json" \
  -d '{"model": "sonicgpt-1", "ownerId": "user_123"}'
# -> { "id": "uuid-...", "title": "Nouvelle conversation", "model": "sonicgpt-1" }

# 2. Envoyer un message (streaming SSE par défaut)
curl -N -X POST https://ton-projet.vercel.app/v1/conversations/uuid-.../messages \
  -H "Authorization: Bearer ta-cle-sonicgpt" \
  -H "Content-Type: application/json" \
  -d '{"content": "Explique-moi la relativité en 2 phrases."}'

# 3. Récupérer l'historique complet
curl https://ton-projet.vercel.app/v1/conversations/uuid-... \
  -H "Authorization: Bearer ta-cle-sonicgpt"

# 4. Lister les conversations d'un utilisateur
curl "https://ton-projet.vercel.app/v1/conversations?ownerId=user_123" \
  -H "Authorization: Bearer ta-cle-sonicgpt"

# 5. Supprimer
curl -X DELETE https://ton-projet.vercel.app/v1/conversations/uuid-... \
  -H "Authorization: Bearer ta-cle-sonicgpt"
```

Le serveur charge automatiquement tout l'historique de la conversation avant chaque appel à Mistral — le client n'a jamais besoin de renvoyer les messages précédents. Le titre de la conversation se déduit automatiquement du premier message.

## Format du flux SSE (route conversations)

```
data: {"delta": "Bon", "done": false}
data: {"delta": "jour", "done": false}
data: {"delta": " !", "done": false}
data: {"delta": "", "done": true, "finishReason": "stop"}
```

## Exemple client JavaScript (streaming côté front)

```js
const res = await fetch("https://ton-projet.vercel.app/v1/conversations/ID/messages", {
    method: "POST",
    headers: {
        "Authorization": "Bearer ta-cle-sonicgpt",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ content: "Bonjour !" })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop();
    for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const json = JSON.parse(line.slice(6));
        if (json.delta) process.stdout.write(json.delta); // ou mise à jour de l'UI
    }
}
```

## Sécurité et limites à considérer

- **Ne mets jamais `MISTRAL_API_KEY` dans du code exécuté côté client** — elle doit rester uniquement dans les variables d'environnement du serveur. C'est déjà comme ça dans ce projet.
- **Rate limiting** : ajoute `express-rate-limit` par `ownerId`/IP avant une mise en prod publique, pour éviter qu'un utilisateur épuise ton crédit Mistral.
- **Coûts** : chaque appel consomme des tokens sur ta clé Mistral. Surveille ta consommation sur le dashboard Mistral, et envisage de fixer un `max_tokens` raisonnable par défaut (déjà à 1024 ici).
- **Modération** : si l'app est ouverte au public, pense à filtrer les contenus abusifs avant de les persister/renvoyer.
