# Workflows n8n · Outbound One More

Code source (Workflow SDK n8n) des workflows qui pilotent le marketing sortant via l'API One More.
Contrat API : [`docs/outbound-n8n-reference.md`](../../docs/outbound-n8n-reference.md).

Ces fichiers sont la **source de vérité**. Toute modification passe par le fichier puis par le MCP n8n (voir le skill [`.cursor/skills/n8n-outbound-workflows/SKILL.md`](../../.cursor/skills/n8n-outbound-workflows/SKILL.md)).

## Arborescence

```text
n8n/outbound/
  README.md
  subs/          briques réutilisables (0x)
  campaigns/     campagnes (1x)
```

Le MCP n8n de cette instance **ne crée pas de dossiers** (`search_folders` absent). Le rangement n8n passe par le préfixe `One More · Outbound · …` et les tags `one-more` / `outbound` / `campagne`. Tu peux glisser les workflows dans un dossier « One More · Outbound » dans l'UI.

## Registre

Instance : `https://tools-n8nwithpostgres-d94398-34-155-156-83.traefik.me` · projet personnel « Team Zilton » · tags `one-more`, `outbound`.

| Fichier | Workflow n8n | ID | Type | Publié |
|---------|--------------|----|------|--------|
| `subs/01-sub-api-call.workflow.ts` | One More · Outbound · [Sub] Appel API | `iQYqQdhUqtZuw4gA` | Sous-workflow | Non |
| `subs/02-sub-send.workflow.ts` | One More · Outbound · [Sub] Envoi unitaire | `Ezmos0oPn6u0jUFQ` | Sous-workflow | Non |
| `subs/03-sub-dispatch.workflow.ts` | One More · Outbound · [Sub] Dispatch segment | `b0KcWFM96bSwLfQL` | Sous-workflow | Non |
| `subs/04-catalog.workflow.ts` | One More · Outbound · Catalogue (manuel) | `MLNFVu8WU5MPXLwZ` | Manuel, lecture seule | Non |
| `campaigns/10-campaign-winback-14d.workflow.ts` | One More · Outbound · Campagne · Winback inactifs 14 j (email) | `lv86eX1eUwf8sJAt` | Planifié (mardi 10:00 Paris) | Non |
| `campaigns/11-campaign-cgu-update.workflow.ts` | One More · Outbound · Campagne · Mise à jour CGU (email) | `EQChL8mE8x0uKOj0` | Manuel, one-shot | Non |
| `campaigns/12-campaign-registered-no-exercise.workflow.ts` | One More · Outbound · Campagne · Pas d'exo réel (push + email) | `sXZkJAv9OJAOEFar` | Planifié (1h / 24h / 3j / 7j / 30j), `activationHook: not_training_reminder` | Non |
| `campaigns/13-campaign-lapsed-after-session.workflow.ts` | One More · Outbound · Campagne · Lapsed après séance (push + email) | `30Ke7oWrXboCczLf` | Planifié (48h / 3j / 7j / 30j) | Non |
| `campaigns/14-campaign-registered-no-exercise-reminder.workflow.ts` | One More · Outbound · Campagne · Pas d'exo · rappel activé (push + email) | `GX7Ttr7NsyoFB0Ms` | Planifié (2h / 24h / 7j / 30j), `activationHook: training_reminder` | Non |

Numérotation : `0x` = briques, `1x` = campagnes.

## Architecture

```text
Campagne (schedule ou manuel) ──► [Sub] Dispatch segment ──► [Sub] Appel API ──► POST /internal/outbound/dispatch
        │                                └─ sondage ─────► [Sub] Appel API ──► GET  /internal/outbound/dispatch/:id
        └─ garde-fou ───────────────────────────────────► [Sub] Appel API ──► GET  /internal/outbound/catalog

Autre workflow ──► [Sub] Envoi unitaire ──► [Sub] Appel API ──► POST /internal/outbound/send
```

- **[Sub] Appel API** est le seul endroit qui connaît l'URL et la clé (node `Config API One More`).
- Les crons lifecycle push (`weekly_recap`, `streak_at_risk`, `training_reminder`, `monthly_ranking_recap`, `new_user_d1_*`) tournent **dans l'API**. Ne pas les recréer dans n8n, sinon double envoi.

## Mise en service

1. Ouvrir **[Sub] Appel API** → node `Config API One More` → remplacer `outboundApiKey = TO_CHANGE` par la valeur de `OUTBOUND_API_KEY` (`api/.env` prod). Pour tester sur staging, mettre aussi `apiBaseUrl = https://api.staging.one-more.app`.
2. Publier les 3 sous-workflows (01, 02, 03).
3. Lancer **Catalogue (manuel)** : doit renvoyer segments + templates. Une 401 = mauvaise clé.
4. Déployer l'API (migrations 2130 `winback_inactive_14d` et 2140 `cgu_update_emails_notice`), relancer le catalogue.
5. **One-shot CGU** : lancer manuellement **Campagne · Mise à jour CGU** (avant le winback).
6. Publier **Campagne · Winback inactifs 14 j** seulement après.
7. Déployer l’API staging (parser `maxDays`/`maxHours`, `activationHook`, migrations `2150` + `2161`) avant de publier les campagnes 12–14. Relancer **Catalogue (manuel)** : templates drip + `registered_no_exercise_reminder_*` (`channel: both`, `category: marketing`, `variables: []`).

## Template : `cgu_update_emails_notice`

Créé par `api/src/database/migrations/2140000000000-outbound-cgu-update-template.ts`.

- `category = 'transactional'` → **pas** de filtre `marketingEmail` (tous les comptes avec email). C'est volontaire : info légale + explication du soft opt-in.
- `variables = '{}'` → le dispatch n'en transmet pas.
- CTA : [https://one-more.app/legal/conditions-generales](https://one-more.app/legal/conditions-generales)
- Copy : tutoiement, pas de `--` ni `—`.

Le désabonnement marketing se fait dans Réglages → Notifications (mentionné dans le mail). Les emails marketing suivants portent le lien RFC 8058.

## Template : `winback_inactive_14d`

Créé par `api/src/database/migrations/2130000000000-outbound-winback-template.ts`.

Contraintes :

- `category = 'marketing'` → filtrage consentement `marketingEmail` + `email_suppressions` + lien de désinscription automatique.
- `variables = '{}'`
- Copy : pas de `--` ni `—`, tutoiement.

Désactiver sans toucher n8n : `UPDATE message_templates SET "isActive" = false WHERE key = 'winback_inactive_14d';`

## Templates drip (migration 215)

Créés par `api/src/database/migrations/2150000000000-outbound-drip-templates.ts`. Neuf templates `category: marketing`, `channel: both`, `variables: []`.

- Pas d’exo : `registered_no_exercise_{1h,24h,3d,7d,30d}` — fenêtres 1–24 h / 24 h–3 j / 3–7 j / 7–30 j / 30–45 j (`not_training_reminder`).
- Pas d’exo + rappel : `registered_no_exercise_reminder_{2h,24h,7d,30d}` — migration **2161**, segment `training_reminder`.
- Lapsed : `lapsed_after_session_{48h,3d,7d,30d}` — fenêtres 48 h–3 j / 3–7 j / 7–30 j / 30–45 j.

Chaque palier lance **deux** dispatchs (`channel: email` puis `push`) parce que l’API n’envoie qu’un canal par dispatch et que le dédup ignore le canal.

## Clés d'idempotence

Format : `n8n:<campagne>:<période>`. La période fixe la fréquence max par utilisateur.

| Campagne | Clé | Effet |
|----------|-----|-------|
| CGU + emails One More | `n8n:cgu-update:2026-10` | 1 email max, définitif |
| Winback 14 j | `n8n:winback-14d:yyyy-MM` | 1 email max par utilisateur et par mois |
| Pas d’exo réel | `n8n:no-exo:<palier>:email` et `:push` | 1 email + 1 push max **à vie** par palier |
| Pas d’exo + rappel | `n8n:no-exo-reminder:<palier>:email` et `:push` | 1 email + 1 push max **à vie** par palier (segment `training_reminder`) |
| Lapsed après séance | `n8n:lapsed:<palier>:email:yyyy-MM` et `:push:yyyy-MM` | 1 email + 1 push max **par mois** par palier |

Côté API, la déduplication réelle est `idempotencyKey:userId` (table `outbound_messages`).
