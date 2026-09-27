# Base Notion · Review pulse (« Pas encore »)

Base **séparée** de la table Tickets. Variable d’env : `NOTION_REVIEW_FEEDBACK_DB_ID`.

Même intégration Notion que le reste : `NOTION_TOKEN`. Connecter l’intégration à **cette** base uniquement (ou aux deux bases si tu utilises aussi Tickets).

## Colonnes à créer (noms **exactes**, sensibles à la casse)

| Colonne Notion | Type Notion | Obligatoire | Contenu |
|----------------|-------------|-------------|---------|
| **Name** | Title | oui | Résumé auto, ex. `Feedback review · Il manque un exercice (+1)` |
| **Status** | Status | oui | Création en **Backlog** (workflow traitement) |
| **Email** | Text | oui | Email session ou `non renseigné` |
| **User ID** | Text | oui | UUID utilisateur |
| **Prénom** | Text | oui | Profil |
| **Nom** | Text | oui | Profil |
| **Chips** | Multi-select | oui | Options ci-dessous (libellés **identiques**) |
| **Message** | Text | non | Texte libre (max 280 côté app) |
| **Platform** | Select | oui | Options : `ios`, `android`, `web` |
| **Sessions** | Number | oui | Nombre de jours de séance distincts |
| **Locale** | Text | oui | ex. `fr`, `en` |
| **App version** | Text | oui | Version app |
| **Date** | Date | oui | Horodatage envoi (ISO client) |
| **Session date** | Text | non | Clé jour séance locale |
| **Device** | Text | non | Si chip « Un bug » |
| **OS** | Text | non | Si chip « Un bug » |

**Pas de colonne Type, Priority, Source.** Toute la base = feedback review pulse. **Status** = ton pipeline (ex. Backlog → En cours → Traité).

**Status** à la création : par défaut **Backlog** (`NOTION_REVIEW_STATUS` pour utiliser ton libellé, ex. `À faire`).

L’API **ajoute automatiquement** les options manquantes sur **Status**, **Platform** et **Chips** (PATCH Notion, cache 1 h) si l’intégration a le droit de modifier la base. Sinon crée-les à la main ou fixe `NOTION_REVIEW_STATUS` sur une option déjà présente.

## Options multi-select **Chips** (copier-coller une par une)

1. Saisie trop lente  
2. Il manque un exercice  
3. Stats et progression  
4. Cardio (Strava, Garmin, Apple Santé)  
5. Import / export de données  
6. Un bug  
7. Autre  

## Options select **Platform**

- ios  
- android  
- web  

## ID de la base

URL Notion → segment 32 caractères hex → `NOTION_REVIEW_FEEDBACK_DB_ID` dans `api/.env`.
