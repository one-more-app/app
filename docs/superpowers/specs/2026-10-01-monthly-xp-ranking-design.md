# Classement mensuel (amis + salle) basé sur l’XP

Date : 2026-10-01  
Statut : validé (design)

## Problème

One More a déjà des ligues (niveau de force), de l’XP (progression perso), des amis et une salle déclarée — mais pas de **classement social** comparable. Sans ça, la motivation entre potes / dans la salle reste faible. Un classement purement « force » serait trichable et démoralisant ; un score custom parallèle à l’XP créerait deux langages produits.

## Décision

**Score classement = somme des XP gagnées sur le mois calendaire** (toutes sources `xp_events` existantes).  
Même score pour deux classements : **amis** et **salle**.  
Page dédiée `/ranking`, pas de nouvel item bottom nav en v1.

## Objectifs produit

- Motivant pour tous les niveaux (l’XP récompense déjà l’activité, pas seulement la charge).
- Simple à comprendre : « plus j’entraîne / progresse ce mois, plus je monte ».
- Peu de surface anti-triche nouvelle : réutiliser les caps XP déjà en place.
- Vie privée salle : opt-in + profil minimal.

## Comportement cible

### Score

- Agrégat : `SUM(xp_events.amount)` où `activityDate` ∈ mois demandé (`YYYY-MM`).
- Sources incluses v1 : `perf`, `personal_record`, `daily_streak`, `league_promotion`.
- Pas de formule parallèle ; pas d’exclusion de sources en v1 (évolutif plus tard si la ligue biaise trop).
- Égalités : même XP → départage par `MAX(earnedAt)` le plus récent, puis `userId` stable.

### Périmètres

| Classement | Inclus | Affiché |
|------------|--------|---------|
| Potes | Friendships `accepted` | Avatar, pseudo, XP mois, badge ligue résumé |
| Salle | Même `placeId` + `rankingOptIn=true` | Idem, profil minimal (pas de détail de perfs) |

- Ligue / palier : **badge** à côté du pseudo, pas un second score de tri.
- Mois en cours + consultation des mois précédents (figés, même formule).

### Opt-in salle

- Défaut : `rankingOptIn = false`.
- Toggle dans réglages salle (+ CTA sur l’onglet Salle si pas opt-in).
- Sans salle déclarée : lien vers le flow / réglages salle.
- Opt-out : disparition immédiate du classement salle ; potes / XP inchangés.

### Fin de mois

- À la première visite de `/ranking` après le 1er du mois : sheet récap du mois précédent (XP totale, rang potes, rang salle si opt-in, nombre de jours avec ≥1 XP).
- Badge / titre léger (ex. « Top 10 potes », « #1 salle ») + stats perso.
- Pas de podium lourd, pas de récompense concrète (Pro / XP bonus) en v1.
- Sheet dismissable ; « déjà vu » stocké **côté client** (`ranking-recap-seen:{YYYY-MM}`) en v1.

### Entrées UI

- Page dédiée route canonique : `/ranking`.
- Accès depuis l’écran Amis (carte / bouton « Classement »).
- Accès depuis réglages salle (toggle + « Voir le classement »).
- Sur profil ami : rang relatif parmi vos potes ce mois (ex. `#3 / 12`) — léger.
- Sous-onglets sur la page : **Potes** | **Salle**.
- Header sticky : mon rang + mon XP du mois.

## Architecture

### Données

- Réutiliser `xp_events` (`userId`, `amount`, `activityDate`, `earnedAt`, `sourceType`).
- Ajouter sur `user_gyms` : `rankingOptIn boolean NOT NULL DEFAULT false`.
- Historique badges fin de mois : calcul à la volée en v1 ; table dédiée possible en v1.1 si besoin de stabilité.

### API

| Méthode | Route | Rôle |
|---------|-------|------|
| `GET` | `/ranking/friends?month=YYYY-MM` | Liste triée potes + objet `me` (rang, xp) |
| `GET` | `/ranking/gym?month=YYYY-MM` | Liste salle opt-in + `me` ; empty/guide si pas de salle ou pas opt-in |
| `PATCH` | `/gyms/me/ranking-opt-in` | `{ enabled: boolean }` |
| `GET` | `/ranking/me/recap?month=YYYY-MM` | Récap mois (pour sheet fin de mois) |

Auth obligatoire. Réponses salle limitées aux champs publics listés ci-dessus.

### Perf

- Agrégat SQL `SUM(amount) GROUP BY userId` sur la liste candidate (ids amis / ids salle opt-in).
- S’appuyer sur l’index existant `(userId, activityDate)` ; ajouter un index/filtre si les listes grossissent.

## Edge cases

- **Changement de salle** : classement salle = `placeId` actuel ; pas d’historique dans l’ancienne salle.
- **Ami retiré** : exclu immédiatement du classement potes.
- **Compte soft-delete / anonymisé** : exclu ; rangs recalculés sans lui.
- **0 XP dans le mois** : listé chez les potes à 0 ; en salle seulement si opt-in.
- **Timezone** : utiliser `activityDate` déjà stockée sur les events (pas de recalcul UTC à la lecture).

## Hors scope (v1)

- Nouvel item bottom nav.
- Classement mondial / régional hors salle.
- Notifications push « tu t’es fait dépasser ».
- Retune de la formule XP globale.
- Exclusion sélective des sources XP (ligue, etc.).
- Cache Redis / realtime leaderboard.
- Récompenses Pro / gifts liées au rang.

## Critères de succès

- Un user voit son rang potes et (si opt-in) salle pour le mois en cours, basés sur la même XP mensuelle.
- Opt-in salle off par défaut ; aucune expo de détail de perfs dans la liste salle.
- Mois précédent consultable ; récap fin de mois montré une fois.
- Aucun second moteur de points à maintenir en parallèle de `xp_events`.

## Tests (orientation)

- Agrégat XP mois : bornes de dates, multi-sources.
- Friends : seuls `accepted` ; soft-delete exclus.
- Gym : filtre `placeId` + opt-in ; opt-out retire de la liste.
- Égalités : ordre stable via `earnedAt` puis `userId`.
- Recap : payload mois clos cohérent ; le flag « déjà vu » est client-only (pas d’API dédiée en v1).
