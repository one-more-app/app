# Outbound marketing — référence n8n

Guide opérationnel pour appeler l’API One More (segments, templates, exemples).  
Architecture et décisions : [`superpowers/specs/2026-10-06-outbound-marketing-design.md`](superpowers/specs/2026-10-06-outbound-marketing-design.md).  
Setup AWS SES, secrets, tracking OpenPanel : [`outbound-ses-setup.md`](outbound-ses-setup.md).

## Authentification

Toutes les routes `/internal/outbound/*` exigent :

```http
X-Outbound-Api-Key: <OUTBOUND_API_KEY>
```

Variable serveur : `OUTBOUND_API_KEY` dans `api/.env`.

## Catalogue live (recommandé)

```http
GET /internal/outbound/catalog
X-Outbound-Api-Key: ***
```

Réponse JSON :

- **`segments`** — clés, descriptions, schéma des `params`
- **`templates`** — contenu actuel en base (`message_templates`), y compris templates ajoutés manuellement
- **`endpoints`** — rappel des routes

Utiliser ce GET dans n8n pour ne pas dupliquer la doc à la main.

---

## Endpoints

| Méthode | Chemin | Corps | Réponse |
|---------|--------|-------|---------|
| GET | `/internal/outbound/catalog` | — | Segments + templates |
| POST | `/internal/outbound/send` | voir ci-dessous | `202` `{ messageId, status, created }` |
| POST | `/internal/outbound/dispatch` | voir ci-dessous | `202` `{ dispatchId, recipients }` |
| GET | `/internal/outbound/dispatch/:id` | — | Statut du batch |

### Envoi unitaire (`send`)

```json
{
  "userId": "uuid-utilisateur",
  "templateKey": "weekly_recap",
  "channel": "push",
  "variables": {
    "sessionCount": 3,
    "xpTotal": 120,
    "streak": 5,
    "sessionLabel": "séances"
  },
  "idempotencyKey": "campagne:2026-10-07:user-uuid"
}
```

- **`channel`** : `email` | `push` | `auto` (optionnel)
- **`idempotencyKey`** : obligatoire ; même clé + même user → pas de double envoi

### Envoi segment (`dispatch`)

```json
{
  "segmentKey": "inactive_since",
  "params": { "days": 7 },
  "templateKey": "mon_template_email",
  "channel": "email",
  "campaignKey": "winback-oct-2026",
  "idempotencyKey": "n8n:winback:2026-10-07",
  "confirmLargeAudience": false
}
```

- Au-delà de `OUTBOUND_MAX_RECIPIENTS` (défaut 5000), l’API refuse sans `"confirmLargeAudience": true`.

---

## Segments

Les segments **ne sont pas une liste stockée**. Aucun cron API ne les « met à jour ». Au `POST /internal/outbound/dispatch`, l’API exécute le SQL **à cet instant** et file les `userId` dans `outbound_messages`.

- **Qui** = prédicat SQL (`api/src/outbound/segments/`).
- **Quand / quelle fréquence** = le trigger n8n (schedule ou manuel). L’API n’a pas de fréquence par segment marketing.
- **Anti-doublon** = `idempotencyKey` (ex. une clé par mois `n8n:winback-14d:2026-10`).

Le catalogue live (`GET /internal/outbound/catalog`) reflète ce tableau.

### Fréquence actuelle

| `segmentKey` | Déclencheur | Fréquence |
|--------------|-------------|-----------|
| `inactive_since` | n8n **Campagne · Winback inactifs 14 j** | Mardi 10:00 Paris, `days: 14`, 1×/mois/`idempotencyKey` |
| `active_with_email` | n8n **Campagne · Mise à jour CGU** | Manuel, one-shot |
| `registered_no_exercise` | n8n **Campagne · Pas d'exo réel** | 1 h / 24 h / 3 j / 7 j / 30 j, push + email, 1×/palier/vie |
| `registered_no_push` | n8n (à brancher) | Tu choisis hours/days dans le trigger |
| `lapsed_after_session` | n8n **Campagne · Lapsed après séance** | 48 h / 3 j / 7 j / 30 j, push + email, 1×/palier/mois |
| `signed_up_days_ago` | **Pas n8n.** Cron API `new-user-d1` | Toutes les minutes, **push** D+1 (ne pas recréer dans n8n) |
| `streak_at_risk` | **Pas n8n.** Cron API `streak-reminder` | Toutes les heures, **push** |

Worker d’envoi (file `pending` → SES) : toutes les **5 secondes**, indépendant des segments.

### Catalogue

| `segmentKey` | `params` | Qui est dedans |
|--------------|----------|----------------|
| `active_with_email` | — | Compte actif + email (info légale, ex. CGU) |
| `inactive_since` | `days?` (défaut **7**) | Email, actif, **aucune** perf (y compris onboarding) sur les N jours calendaires UTC |
| `signed_up_days_ago` | `days?` (défaut **1**), **`timezone`** | Device token dans ce fuseau, inscrit il y a N jours (date locale) |
| `streak_at_risk` | **`timezone`** | Série en danger aujourd’hui, pas de perf aujourd’hui |
| `registered_no_exercise` | **`days` et/ou `hours`** (total ≥ 1 h) ; optionnel **`maxDays`/`maxHours`** | Inscrit depuis au moins ce délai, **pas d’exo réel** |
| `registered_no_push` | **`days` et/ou `hours`** (total ≥ 1 h) ; optionnel **`maxDays`/`maxHours`** | Inscrit depuis au moins ce délai, **aucun** `device_tokens` (push OS jamais activé) |
| `lapsed_after_session` | **`days` et/ou `hours`** (total ≥ 1 h) ; optionnel **`maxDays`/`maxHours`** | A une **séance réelle**, plus d’activité app depuis ce délai |

`days` + `hours` s’additionnent. Exemples : `{ "hours": 24 }`, `{ "days": 2 }`, `{ "days": 1, "hours": 12 }` → 36 h.

`maxDays`/`maxHours` (optionnel) ferme la fenêtre : min **inclus**, max **exclus**. Sans max, tout le monde au-delà du min est ciblé. Les drips n8n posent toujours un max pour qu’un inscrit depuis 30 j ne reçoive pas le palier 1 h. Ex. palier 1 h : `{ "hours": 1, "maxHours": 24 }`.

### Exo / séance « réelle » (hors onboarding)

Pas de colonne `source` sur les perfs. Heuristique :

- onboarding = au plus **1** exercice suivi et **1** performance ;
- séance réelle = **2+** exercices **ou** **2+** perfs.

Un user qui a skip l’onboarding et n’a loggé **qu’un** set ressemble à de l’onboarding : il reste dans `registered_no_exercise`.

### « Pas revenu sur l’app »

`lapsed_after_session` prend le max de :

- `sessions.lastSeenAt` (refresh auth) ;
- `device_tokens.lastSeenAt` (re-register FCM) ;
- `performance_entries.updatedAt`.

Ce n’est pas OpenPanel. Un user qui ouvre l’app sans refresh ni push peut rester « lapsed ».

### Exemples dispatch

```json
{
  "segmentKey": "registered_no_exercise",
  "params": { "hours": 24, "maxDays": 3 },
  "templateKey": "registered_no_exercise_24h",
  "channel": "email",
  "campaignKey": "no-exo-24h",
  "idempotencyKey": "n8n:no-exo:24h:email"
}
```

```json
{
  "segmentKey": "registered_no_push",
  "params": { "days": 1 },
  "templateKey": "ton_template",
  "channel": "email",
  "campaignKey": "no-push-d1",
  "idempotencyKey": "n8n:no-push-d1:2026-10-08"
}
```

```json
{
  "segmentKey": "lapsed_after_session",
  "params": { "days": 3, "maxDays": 7 },
  "templateKey": "lapsed_after_session_3d",
  "channel": "email",
  "campaignKey": "lapsed-3j-2026-10",
  "idempotencyKey": "n8n:lapsed:3j:email:2026-10"
}
```

Implémentation : `api/src/outbound/segments/*.segment.ts`.

---

## Templates seed (migration 212)

Après migrations, ces clés existent en base (push / lifecycle) :

| `templateKey` | `category` | `channel` | `variables` |
|---------------|------------|-----------|-------------|
| `weekly_recap` | transactional | push | sessionCount, xpTotal, streak, sessionLabel |
| `monthly_ranking_recap` | transactional | push | xpTotal, month, monthLabel |
| `streak_at_risk` | transactional | push | streak, today |
| `training_reminder` | transactional | push | today |
| `new_user_d1_morning` | transactional | push | — |
| `new_user_d1_midday_train` | transactional | push | — |
| `new_user_d1_referral` | transactional | push | — |
| `new_user_d1_evening` | transactional | push | — |

Placeholders dans le contenu : `{{nomVariable}}` (liste strictement déclarée dans `variables`).

### Templates email seedés (migrations 213 / 214)

| `templateKey` | `category` | `channel` | Usage |
|---------------|------------|-----------|--------|
| `winback_inactive_14d` | marketing | email | Winback inactifs 14 j |
| `cgu_update_emails_notice` | transactional | email | One-shot CGU + info emails One More |

### Templates drip (migration 215)

| `templateKey` | `category` | `channel` | Palier |
|---------------|------------|-----------|--------|
| `registered_no_exercise_1h` | marketing | both | Inscrit, pas d’exo réel, 1–24 h |
| `registered_no_exercise_24h` | marketing | both | 24 h–3 j |
| `registered_no_exercise_3d` | marketing | both | 3–7 j |
| `registered_no_exercise_7d` | marketing | both | 7–30 j |
| `registered_no_exercise_30d` | marketing | both | 30–45 j |
| `lapsed_after_session_48h` | marketing | both | Séance réelle, inactif 48 h–3 j |
| `lapsed_after_session_3d` | marketing | both | 3–7 j |
| `lapsed_after_session_7d` | marketing | both | 7–30 j |
| `lapsed_after_session_30d` | marketing | both | 30–45 j |

Copy FR tutoiement, CTA `https://one-more.app/#/home`, push route `/home`. `variables: []`.

### Templates email marketing additionnels

Non seedés. Insérer dans `message_templates` avec :

- `category`: `marketing`
- `channel`: `email` ou `both`
- `content.email`: `subject`, `preheader`, `eyebrow`, `title`, `bodyHtml`, `bodyText`, optionnel `cta`, `secondaryText`

Schéma TypeScript : `api/src/outbound/entities/message-template.entity.ts`.

---

## Consentement & filtres

| Type | Filtre |
|------|--------|
| Email **marketing** | `marketingEmail` + pas dans `email_suppressions` |
| Email **transactionnel** (ex. CGU) | Compte actif + email, **sans** filtre `marketingEmail` |
| Push lifecycle (ex. weekly_recap) | Préférences push existantes (weeklyRecap, streakReminders, etc.) |

Désinscription : page API `GET/POST /u/:token` (pas le client React).

---

## Transport email

1. **SES** si `AWS_SES_*` + `SES_FROM_ADDRESS` configurés (tracking via `/webhooks/ses`)
2. Sinon **SMTP** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, …) — même config que les mails transactionnels existants

---

## Variables d’environnement (rappel)

Voir `api/.env.example` : `OUTBOUND_API_KEY`, `PUBLIC_API_URL`, `OUTBOUND_MAX_RECIPIENTS`, bloc SES, bloc SMTP.

Runbook SES (identité DKIM, Configuration Set, SNS → `/webhooks/ses`, events OpenPanel `email_sent` / `email_opened` / `email_clicked`) : [`outbound-ses-setup.md`](outbound-ses-setup.md). Sans SES, repli SMTP : pas d’open/click.

---

## Workflows n8n en place

Code source et registre des IDs : [`n8n/outbound/`](../n8n/outbound/README.md) (`subs/` + `campaigns/`). Maintenance : skill `n8n-outbound-workflows`.

| Workflow | Rôle |
|----------|------|
| `[Sub] Appel API` | Seul porteur de l’URL et de la clé `X-Outbound-Api-Key` |
| `[Sub] Envoi unitaire` | `POST /send` validé, réutilisable par d’autres workflows |
| `[Sub] Dispatch segment` | `POST /dispatch` puis sondage `GET /dispatch/:id` jusqu’à `completed` / `failed` |
| `Catalogue (manuel)` | Test de connexion + liste des templates utilisables |
| `Campagne · Mise à jour CGU (email)` | Manuel one-shot, `active_with_email` → `cgu_update_emails_notice` |
| `Campagne · Winback inactifs 14 j (email)` | Mardi 10:00, `inactive_since` 14 j → `winback_inactive_14d`, max 1/mois/utilisateur |
| `Campagne · Pas d'exo réel (push + email)` | 1 h / 24 h / 3 j / 7 j / 30 j, `registered_no_exercise` fenêtres exclusives, 2 dispatchs, 1×/palier/vie. Brouillon. |
| `Campagne · Lapsed après séance (push + email)` | 48 h / 3 j / 7 j / 30 j, `lapsed_after_session` fenêtres exclusives, 2 dispatchs, 1×/palier/mois. Brouillon. |

Nouvelle campagne : partir de `n8n/outbound/campaigns/10-campaign-winback-14d.workflow.ts`, ne jamais appeler l’API en HTTP direct.
