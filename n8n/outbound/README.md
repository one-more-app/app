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

## Clés d'idempotence

Format : `n8n:<campagne>:<période>`. La période fixe la fréquence max par utilisateur.

| Campagne | Clé | Effet |
|----------|-----|-------|
| CGU + emails One More | `n8n:cgu-update:2026-10` | 1 email max, définitif |
| Winback 14 j | `n8n:winback-14d:yyyy-MM` | 1 email max par utilisateur et par mois |

Côté API, la déduplication réelle est `idempotencyKey:userId` (table `outbound_messages`).
