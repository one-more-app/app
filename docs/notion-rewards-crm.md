# Base Notion · Rewards CRM (t-shirts)

Variables :

- `NOTION_TOKEN` (partagé avec le feedback)
- `NOTION_REWARDS_DB_ID` (base [Rewards CRM](https://app.notion.com/p/3e8351ddcd2180a79c3fdd8b9927ce32), sous Databases)
- `NOTION_REWARDS_STATUS` (optionnel, défaut `À traiter`)

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
