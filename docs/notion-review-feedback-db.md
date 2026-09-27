# Base Notion · Retours clients (review + réglages)

Une seule base. Variables :

- `NOTION_TOKEN`
- `NOTION_REVIEW_FEEDBACK_DB_ID` **ou** `NOTION_FEEDBACK_DB_ID` (même ID possible)

## Colonnes à créer

| Colonne | Type Notion | Rôle |
|---------|-------------|------|
| **Name** | Title | Titre / résumé |
| **Source** | **Select** | `Review pulse` · `Réglages` |
| **Type** | **Select** | `Bug` · `Idea` · `Suggestion` · `Review` |
| **Status** | Status | Workflow (défaut API : `NOTION_REVIEW_STATUS` ou `Backlog`) |
| **Email** | Text | |
| **User ID** | Text | |
| **Prénom** | Text | |
| **Nom** | Text | |
| **Message** | Text | Description / message libre |
| **Chips** | Multi-select | Review pulse uniquement (7 libellés, sans virgule) |
| **Platform** | Select | `ios` · `android` · `web` |
| **Sessions** | Number | Review pulse |
| **Locale** | Text | Review pulse |
| **App version** | Text | |
| **Date** | Date | Review pulse |
| **Session date** | Text | Optionnel |
| **Device** | Text | Optionnel |
| **OS** | Text | Optionnel |

L’API **ajoute les options** manquantes sur Source, Type, Platform, Chips, Status (si droits intégration).

## Mapping app → Notion

| Entrée | Source | Type |
|--------|--------|------|
| Review pulse « Pas encore » | Review pulse | Review |
| Réglages · Bug | Réglages | Bug |
| Réglages · Idée | Réglages | Idea |
| Réglages · Suggestion | Réglages | Suggestion |

## Chips (multi-select)

Pas de virgule dans un libellé (Notion).

1. Saisie trop lente  
2. Il manque un exercice  
3. Stats et progression  
4. Cardio (Strava · Garmin · Apple Santé)  
5. Import / export de données  
6. Un bug  
7. Autre  
