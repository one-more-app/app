# Multi-séances + page hybride séance / récap

Date : 2026-10-09  
Statut : validé (design)

## Objectif

1. Remplacer l’agrégat virtuel « 1 user × 1 jour = 1 séance » par des séances first-class (`sessionId`), avec **plusieurs séances possibles le même jour**.
2. Fusionner `SessionPage` et `RecapPage` : une seule route `/session/:sessionId` qui devient un **récap hybride** (récap en haut + détail exos / commentaires) quand la séance est terminée (propriétaire).

## Décisions produit

| Sujet | Choix |
|---|---|
| UI terminée (owner) | Hybride : récap (volume, share, records) puis exos + commentaires |
| UI terminée (ami) | Détail exos + commentaires seulement (pas le partage perso) |
| UI live | Détail + badge live (comme aujourd’hui) |
| Clôture | `POST …/end` **et** idle ≥ 25 min (persisté) |
| Après clôture | Prochaine série = **nouvelle** séance (plus de reopen jour) |
| Compat clients | Endpoints `:ownerUserId/:date` **deprecated**, conservés (agrégat jour) |
| Routes API neuves | `/sessions/:sessionId` (pas de préfixe `by-id`) |
| Streaks / XP / ranking | Restent **day-keyed** (inchangés) |
| Historique pré-migration | Backfill **1 session / jour** (pas de multi rétroactif) |
| Force-update | Non requis au ship ; retrait legacy plus tard via `minVersion` |

## Modèle de données

### Table `workout_sessions`

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `ownerUserId` | uuid | FK users CASCADE |
| `sessionDate` | date | Jour calendaire (timezone métier existante) |
| `startedAt` | timestamptz | Première série (ou création) |
| `endedAt` | timestamptz nullable | Null = ouverte |
| `createdAt` | timestamptz | |

Index : `(ownerUserId, sessionDate)`, `(ownerUserId, endedAt)` pour retrouver la session ouverte.

### Rattachements

- `performance_entries.workoutSessionId` (FK, NOT NULL après backfill des non-deleted)
- `session_comments.workoutSessionId` (+ conserver `sessionDate` pour legacy / requêtes jour)
- `session_reactions.workoutSessionId` (idem)
- `workout_session_ends` : table legacy ; nouvelles fins écrivent `workout_sessions.endedAt`. La facade date peut encore lire/écrire via la session ouverte du jour.

## Cycle de vie

```
Nouvelle série
  → session ouverte du jour et idle < 25 min ? attacher
  → sinon lazy-close l’ouverte si besoin, puis créer une nouvelle session

POST /sessions/:sessionId/end (owner)
  → endedAt = now (idempotent si déjà clos)

GET /sessions/:sessionId
  → si ouverte et idle ≥ 25 min : persist endedAt = lastSetAt (lazy-close)
```

`resolveExplicitSessionEnd` (reopen si série après end) **ne s’applique plus** au chemin `sessionId`. La facade jour legacy peut continuer à agréger sans créer de multi pour les vieux clients.

## API

### Nouveau (client à jour)

| Méthode | Route |
|---|---|
| GET | `/sessions/:sessionId` |
| POST | `/sessions/:sessionId/end` |
| GET/POST | `/sessions/:sessionId/comments` |
| PATCH/DELETE | `/sessions/:sessionId/comments/:commentId` |
| POST | `/sessions/:sessionId/reactions` |
| GET | `/sessions/:ownerUserId/day/:date` | Liste résumée des séances du jour |

Réponse GET séance : comme aujourd’hui + `id` ; `date` = `sessionDate` ; `xpEarned` = XP des perfs de **cette** séance (somme grants liés) ou proxy journalier si trop coûteux — **préférence** : XP des entries de la session ; streaks restent day-keyed ailleurs.

### Legacy (deprecated)

`/sessions/:ownerUserId/:date…` inchangé en forme :

- Agrégat de **toutes** les perfs / comments / reactions du jour
- `isLive` si une session du jour est live
- `POST …/end` clôture la session **ouverte** du jour
- Vieux clients ne voient pas le multi

### Realtime

- Nouveau : room `session:{sessionId}` (+ events comment/reaction/perf avec `sessionId`)
- Legacy : room `session:{owner}:{date}` conservée

## Client

| Avant | Après |
|---|---|
| `/session/:user/:date` | `/session/:sessionId` |
| `/session/:user/:date/recap` | redirect → `/session/:sessionId` |
| Legacy deep links | Redirect : live du jour sinon dernière séance du jour |

- `SessionLiveBar` termine puis `navigate(/session/:sessionId)`
- Home / history / social / notifs : liens `sessionId`
- Historique : groupement jour ; si N>1, sous-liste par séance

## Tests

- Unitaires API : attach, idle close, end, multi même jour, legacy facade
- E2E smoke : session-view, end→hybrid (URL sans `/recap`), live-bar, share story

## Hors scope

- Force-update immédiat
- Reconstruction multi-séances sur l’historique passé
- Changement sémantique « N séances » hebdo (= jours actifs)
- AppsFlyer deep links séance
