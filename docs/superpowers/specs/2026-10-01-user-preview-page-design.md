# Page preview utilisateur (avant profil ami)

Date : 2026-10-01  
Statut : validé (design)

## Objectif

Rendre `/friends/preview/:userId` plus accueillante et informative, tout en restant légère : visible aussi pour les non-amis, dans la DA de l’app, sans exposer le détail du profil ami.

## Décision

Approche **carte identité + grille stats compacte** :
- polish UI avec les patterns existants (`Card`, `ProBadge`, cases `bg-secondary`)
- enrichir l’API preview avec 3 infos publiques sûres : Pro, amis en commun, jours actifs du mois

## Structure UI

Coquille inchangée : `BackHeader` + `main` `max-w-2xl` + `bg-background`.

1. **Carte identité** — avatar (~80px), nom + `ProBadge` si `isPremium`, `@username` en secondaire
2. **Carte stats** — 3 cases : Niveau · Série · Jours actifs ce mois
3. **Ligne sociale** — affichée seulement si `mutualFriendsCount > 0` (« X amis en commun ») ; pas d’avatars
4. **Actions** — logique métier inchangée :
   - ami accepté → Voir le profil + Message
   - demande entrante → Accepter / Refuser
   - demande sortante → statut « Demande envoyée »
   - sinon → Ajouter

**Explicitement exclus** : barre XP, ligue, records, historique, muscle map, exercices, avatars des amis en commun.

## API

Enrichir `GET /social/users/:userId/preview` (existant) :

| Champ | Type | Source |
|-------|------|--------|
| `isPremium` | `boolean` | user cible |
| `mutualFriendsCount` | `number` | intersection amis acceptés viewer ↔ cible (même idée que suggestions) |
| `activeDaysThisMonth` | `number` | jours distincts avec activité ce mois calendaire |

Champs déjà présents conservés : `userId`, identité, `avatarUrl`, `level`, `streakCurrent`, statut / direction / id d’amitié.

**Non exposé** : XP, performances, historique, ligue, liste nominative des amis en commun.

## Client

- Étendre le type `UserPreview` dans `social-api.ts`
- Refondre le layout de `UserPreviewPage.tsx`
- Strings FR dans `translations.ts` (labels stats / amis en commun — réutiliser `friendSuggestionMutual*` si adapté)
- Loading : skeleton cartes (identité + stats) à la place du texte « Chargement… »
- Erreur / introuvable : message actuel `friendProfileUnavailable`

## Fichiers touchés

- `app/api/src/social/friends.service.ts` (`getUserPreview`)
- éventuel helper mutual count réutilisé depuis suggestions
- `app/client/src/pages/UserPreviewPage.tsx`
- `app/client/src/lib/social-api.ts`
- `app/client/src/lib/translations.ts`
- optionnel : petit composant stats si la page grossit trop

## Hors scope

- Redesign du vrai profil ami (`FriendProfilePage` / `ProfileView`)
- Nouvel endpoint dédié
- Liste ou avatars des amis en commun
