# Badges profil (système générique)

Date : 2026-10-01  
Statut : validé (design)

## Décision

Système de badges **générique** sur le profil (pas limité au classement).  
V1 : kind `ranking_gym` uniquement (Top 1 / 3 / 10 / 50). Extensible à streak / records.

## Modèle

Table `user_badges` :
- `userId`, `kind`, `tier`, `sourceKey` (unicité), `earnedAt`, `meta` (jsonb), `deeplink`

Unicité : `(userId, kind, sourceKey)` — ex. un badge salle par mois.

## ranking_gym

| Rang | tier |
|------|------|
| 1 | top1 |
| 2–3 | top3 |
| 4–10 | top10 |
| 11–50 | top50 |

Attribution idempotente dans `GET /ranking/me/recap` pour un mois clos.  
Deeplink : `/ranking?tab=gym&month=YYYY-MM`

## API

- `GET /badges/me` — liste ordonnée `earnedAt` desc
- Recap enrichi : `badge` optionnel du mois

## UI

- Profil : section badges cliquables
- Sheet récap : affiche le badge du mois si gagné
