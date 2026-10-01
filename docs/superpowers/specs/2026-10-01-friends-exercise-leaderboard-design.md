# Classement amis par exercice (1RM)

Date : 2026-10-01  
Statut : validé (design)

## Problème

Sur un exercice suivi, l’utilisateur ne peut pas se comparer à ses amis qui font le même exo. Les perfs et le social existent, mais il n’y a pas de classement multi-users hors stand événementiel.

## Décisions

| Sujet | Choix |
|---|---|
| Critère | Meilleur 1RM estimé (`estimate1RM` + règles bodyweight existantes) |
| Affichage | 1RM + série source `weight × reps` (celle qui produit ce 1RM) |
| Périmètre | Amis `accepted` + même `exerciseId` catalogue + ≥1 perf |
| Matching custom / fuzzy | Non |
| UI | Section permanente sur la page détail d’exo |
| Empty | Message + CTA amis si aucun ami comparable |
| Privacy | Même périmètre amis (pas d’opt-in) |
| Cache | Non — calcul à la volée |
| Tie-break | `oneRM` desc → `sourceReps` desc → `sourceDate` desc |
| Bodyweight sans `weightKg` | Fallback `estimate1RM(weight, reps)` simple |
| Viewer | Inclus seulement s’il a une perf éligible |

Hors scope : classement global, matching fuzzy exos custom, opt-in privacy, table best-1RM, écran dédié.

## Architecture

```
ExerciseDetailPage
  └── FriendsExerciseLeaderboard
        └── GET /social/exercises/:exerciseId/friends-leaderboard
              ├── friendships (accepted)
              ├── tracked_exercises (exerciseId, non deleted)
              ├── performance_entries (non deleted)
              ├── user_profiles (username, avatarUrl, weightKg)
              └── bestEstimatedOneRmFromEntries → ranked list
```

## API

### `GET /social/exercises/:exerciseId/friends-leaderboard`

Auth JWT requise. `400` si `exerciseId` vide.

Réponse :

```json
{
  "exerciseId": "exdb-...",
  "entries": [
    {
      "rank": 1,
      "userId": "...",
      "username": "alice",
      "avatarUrl": null,
      "isMe": false,
      "oneRM": 102.5,
      "sourceWeight": 90,
      "sourceReps": 5,
      "sourceDate": "2026-09-20"
    }
  ],
  "emptyReason": null
}
```

`emptyReason` : `"no_friends_on_exercise"` quand aucun ami n’a de perf sur cet exo (la liste peut quand même contenir le viewer seul), sinon `null`.

## Client

- Fetch via `social-api`
- Section toujours visible sous les stats / ligue
- Highlight `isMe` ; tap ami → `/friends/:userId`
- Refresh après ajout de perf sur cet exo
- Exo custom sans `exerciseId` catalogue : message dédié sans appel inutile

## Tests

- Helper shared : best 1RM, bodyweight, fallback, ties
- API : filtre amis, matching, soft-delete, viewer
- Client smoke si pattern existant
