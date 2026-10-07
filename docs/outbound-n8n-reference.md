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

## Segments (code)

| `segmentKey` | `params` | Description |
|--------------|----------|-------------|
| `active_with_email` | — | Comptes actifs avec email (one-shot d’info, ex. CGU) |
| `inactive_since` | `days?` (défaut **7**) | Email + compte actif, aucune perf sur les N derniers jours |
| `signed_up_days_ago` | `days?` (défaut **1**), **`timezone`** (requis) | Inscription il y a N jours dans le fuseau IANA |
| `streak_at_risk` | **`timezone`** (requis) | Série en danger aujourd’hui, pas de perf aujourd’hui |

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

Nouvelle campagne : partir de `n8n/outbound/campaigns/10-campaign-winback-14d.workflow.ts`, ne jamais appeler l’API en HTTP direct.
