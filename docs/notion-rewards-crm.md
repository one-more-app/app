# Base Notion · Rewards CRM (t-shirts)

Variables :

- `NOTION_TOKEN` (partagé avec le feedback)
- `NOTION_REWARDS_DB_ID` (base [Rewards CRM](https://app.notion.com/p/3e8351ddcd2180a79c3fdd8b9927ce32), sous Databases)
- `NOTION_REWARDS_STATUS` (optionnel, défaut `À traiter`)
- `NOTION_WEBHOOK_VERIFICATION_TOKEN` (secret handshake webhook Notion, distinct de `NOTION_TOKEN`)

## Déclencheur

`POST /me/rewards/tshirt/claim` : après enregistrement Postgres (statut `pending` + adresse), l’API crée une page Notion en best-effort (comme le webhook ops). L’échec Notion ne bloque pas le claim.

## Colonnes

| Colonne | Type Notion | Rôle |
|---------|-------------|------|
| **Nom** | Title | Nom complet livraison |
| **Type** | Select | `Parrainage` · `Pack annuel` |
| **Statut** | Status | Défaut API : `À traiter` (options aussi `Expédié`, `Livré`) |
| **Taille** | Select | `XS` … `XXL` |
| **Email** | Email | Session JWT |
| **User ID** | Text | |
| **Claim ID** | Text | UUID claim Postgres |
| **Rue** | Text | |
| **Ville** | Text | |
| **Code postal** | Text | |
| **Pays** | Text | |
| **Réclamé le** | Date | `claimedAt` |

L’API **ajoute les options** manquantes sur Type, Taille et Statut (si droits intégration).

## Mapping app → Notion

| `rewardType` (API) | Type Notion |
|--------------------|-------------|
| `referral_limited` | Parrainage |
| `annual_classic_pack` | Pack annuel |

## Notion → app (statut livraison)

Webhook intégration Notion, événement **`page.properties_updated`** uniquement.

| Environnement | URL |
|---------------|-----|
| Staging | `https://api.staging.one-more.app/webhooks/notion/rewards` |
| Production | `https://api.one-more.app/webhooks/notion/rewards` |

1. Déployer l’API avec la migration `notionPageId` (sans encore `NOTION_WEBHOOK_VERIFICATION_TOKEN`).
2. Créer la souscription dans l’intégration Notion → onglet **Webhooks**.
3. Notion envoie `{ "verification_token": "secret_…" }` : l’API log le token (niveau warn).
4. Copier ce token dans `NOTION_WEBHOOK_VERIFICATION_TOKEN`, redémarrer l’API, puis **Verify** dans Notion.

À chaque changement de **Statut** sur une page de la base Rewards CRM :

1. Notion appelle le webhook (signature `X-Notion-Signature`).
2. L’API relit la page via `NOTION_TOKEN` (le corps du webhook n’est jamais source de vérité).
3. Liaison claim : `notionPageId` en base, ou **Claim ID** pour les pages créées avant cette version.
4. Mise à jour Postgres + push utilisateur si passage **vers l’avant** uniquement.

| Statut Notion | Statut app | Push |
|---------------|------------|------|
| À traiter | `pending` | non |
| Expédié | `shipped` | oui |
| Livré | `delivered` | oui |

Aucune autre colonne Notion n’est recopiée en base. L’API ne réécrit pas Notion après sync.
