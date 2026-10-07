# Workflows n8n · Outbound One More

Code source (Workflow SDK n8n) des workflows qui pilotent le marketing sortant via l'API One More.
Contrat API : [`docs/outbound-n8n-reference.md`](../../docs/outbound-n8n-reference.md).

Ces fichiers sont la **source de vérité**. Toute modification passe par le fichier puis par le MCP n8n (voir le skill [`.cursor/skills/n8n-outbound-workflows/SKILL.md`](../../.cursor/skills/n8n-outbound-workflows/SKILL.md)).

## Registre

Instance : `https://tools-n8nwithpostgres-d94398-34-155-156-83.traefik.me` · projet personnel « Team Zilton » · tags `one-more`, `outbound`.

| Fichier | Workflow n8n | ID | Type | Publié |
|---------|--------------|----|------|--------|
| `01-sub-api-call.workflow.ts` | One More · Outbound · [Sub] Appel API | `iQYqQdhUqtZuw4gA` | Sous-workflow | Non |
| `02-sub-send.workflow.ts` | One More · Outbound · [Sub] Envoi unitaire | `Ezmos0oPn6u0jUFQ` | Sous-workflow | Non |
| `03-sub-dispatch.workflow.ts` | One More · Outbound · [Sub] Dispatch segment | `b0KcWFM96bSwLfQL` | Sous-workflow | Non |
| `04-catalog.workflow.ts` | One More · Outbound · Catalogue (manuel) | `MLNFVu8WU5MPXLwZ` | Manuel, lecture seule | Non |
| `10-campaign-winback-14d.workflow.ts` | One More · Outbound · Campagne · Winback inactifs 14 j (email) | `lv86eX1eUwf8sJAt` | Planifié (mardi 10:00 Paris) | Non |

Numérotation : `0x` = briques (sous-workflows, outils), `1x` = campagnes planifiées.

## Architecture

```text
Campagne (schedule) ──► [Sub] Dispatch segment ──► [Sub] Appel API ──► POST /internal/outbound/dispatch
        │                        └─ sondage ─────► [Sub] Appel API ──► GET  /internal/outbound/dispatch/:id
        └─ garde-fou ───────────────────────────► [Sub] Appel API ──► GET  /internal/outbound/catalog

Autre workflow ──► [Sub] Envoi unitaire ──► [Sub] Appel API ──► POST /internal/outbound/send
```

- **[Sub] Appel API** est le seul endroit qui connaît l'URL et la clé (node `Config API One More`).
- Les crons lifecycle push (`weekly_recap`, `streak_at_risk`, `training_reminder`, `monthly_ranking_recap`, `new_user_d1_*`) tournent **dans l'API**. Ne pas les recréer dans n8n, sinon double envoi.

## Mise en service

1. Ouvrir **[Sub] Appel API** → node `Config API One More` → remplacer `outboundApiKey = TO_CHANGE` par la valeur de `OUTBOUND_API_KEY` (`api/.env` prod). Pour tester sur staging, mettre aussi `apiBaseUrl = https://api.staging.one-more.app`.
2. Publier les 3 sous-workflows (01, 02, 03).
3. Lancer **Catalogue (manuel)** : doit renvoyer segments + templates. Une 401 = mauvaise clé.
4. Créer le template `winback_inactive_14d` (SQL ci-dessous), relancer le catalogue : la clé doit apparaître dans `templatesEmailMarketing` et `templatesUtilisablesEnDispatch`.
5. Publier **Campagne · Winback inactifs 14 j**.

## Template requis : `winback_inactive_14d`

Contraintes imposées par l'API :

- `category = 'marketing'` → filtrage consentement `marketingEmail` + `email_suppressions` + lien de désinscription automatique.
- `variables = '{}'` → le dispatch ne transmet aucune variable. Le prénom est injecté par le layout email, pas besoin de variable.
- Copy : pas de `--` ni `—` (règle `copywriting-french`), tutoiement.

```sql
INSERT INTO message_templates (key, category, channel, variables, content)
VALUES (
  'winback_inactive_14d',
  'marketing',
  'email',
  '{}',
  '{
    "email": {
      "subject": "Ta prochaine séance t''attend",
      "preheader": "Deux semaines sans séance. On reprend tranquille ?",
      "eyebrow": "One More",
      "title": "On reprend ?",
      "bodyHtml": "<p>Ça fait deux semaines qu''on ne t''a pas vu passer. Pas de pression : une séance courte suffit pour relancer la machine.</p><p>Tes records et ta progression sont toujours là.</p>",
      "bodyText": "Ça fait deux semaines qu''on ne t''a pas vu passer. Pas de pression : une séance courte suffit pour relancer la machine. Tes records et ta progression sont toujours là.",
      "cta": { "label": "Reprendre l''entraînement", "href": "https://one-more.app/#/home" }
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
```

Désactiver la campagne sans toucher n8n : `UPDATE message_templates SET "isActive" = false WHERE key = 'winback_inactive_14d';` (le garde-fou du workflow s'arrête alors en erreur explicite).

## Clés d'idempotence

Format : `n8n:<campagne>:<période>`. La période fixe la fréquence max par utilisateur, indépendamment de la fréquence du schedule.

| Campagne | Clé | Effet |
|----------|-----|-------|
| Winback 14 j | `n8n:winback-14d:yyyy-MM` | 1 email max par utilisateur et par mois |

Côté API, la déduplication réelle est `idempotencyKey:userId` (table `outbound_messages`).
