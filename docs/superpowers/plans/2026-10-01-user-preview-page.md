# User Preview Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir `/friends/preview/:userId` (UI + API) avec Pro, amis en commun et jours actifs du mois, sans exposer le profil ami complet.

**Architecture:** Étendre `FriendsService.getUserPreview` (isPremium, mutualFriendsCount, activeDaysThisMonth). Refondre `UserPreviewPage` en cartes identité / stats / actions, alignées sur la DA profil.

**Tech Stack:** NestJS + TypeORM, React, SWR, Tailwind, Vitest/Jest.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-10-01-user-preview-page-design.md`
- Pas d’XP, ligue, historique, muscle map, avatars d’amis en commun
- Réutiliser `Card`, `ProBadge`, `profileNestedClass`, labels UI existants
- Ne pas committer sauf demande explicite de l’utilisateur

## File Structure

| File | Responsibility |
|---|---|
| `api/src/social/lib/mutual-friends-count.ts` | Intersection d’IDs d’amis |
| `api/src/social/lib/mutual-friends-count.spec.ts` | Tests unitaires |
| `api/src/social/friends.service.ts` | Enrichir `getUserPreview` |
| `client/src/lib/social-api.ts` | Type `UserPreview` |
| `client/src/pages/UserPreviewPage.tsx` | Layout preview |
| `client/src/lib/translations.ts` | Labels si manquants |

---

### Task 1: Helper mutual friends + API preview

**Files:**
- Create: `api/src/social/lib/mutual-friends-count.ts`
- Create: `api/src/social/lib/mutual-friends-count.spec.ts`
- Modify: `api/src/social/friends.service.ts` (`getUserPreview`)

**Interfaces:**
- Produces:
  - `countMutualFriendIds(a: string[], b: string[]): number`
  - `getUserPreview` retourne aussi `isPremium`, `mutualFriendsCount`, `activeDaysThisMonth`

- [x] **Step 1: Helper + test**

```ts
export function countMutualFriendIds(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let n = 0;
  for (const id of a) {
    if (setB.has(id)) n += 1;
  }
  return n;
}
```

- [x] **Step 2: Enrichir `getUserPreview`**

Après chargement profil / friendship / progress :
- `loadPremiumByUserIds(this.usersRepo, [targetUserId])`
- `getAcceptedFriendIds` pour viewer et target → `countMutualFriendIds`
- `this.progressService.getActivity(targetUserId)` → `activeDayCount`

- [x] **Step 3: Run** `cd api && npx jest src/social/lib/mutual-friends-count.spec.ts`

---

### Task 2: Client type + page UI

**Files:**
- Modify: `client/src/lib/social-api.ts` (`UserPreview`)
- Modify: `client/src/pages/UserPreviewPage.tsx`
- Modify: `client/src/lib/translations.ts` only if besoin (sinon réutiliser `friendSuggestionMutual*`, `profileLevelLabel`, `profileStreakLabel`, `profileActiveDaysThisMonth`)

**Interfaces:**
- Consumes: `UserPreview` enrichi
- Produces: page avec carte identité, grille 3 stats, ligne mutual (si > 0), actions inchangées

- [x] **Step 1: Étendre le type**

```ts
export type UserPreview = {
  // ...existing
  isPremium: boolean;
  mutualFriendsCount: number;
  activeDaysThisMonth: number;
};
```

- [x] **Step 2: Refondre `UserPreviewPage`**
  - Skeleton cartes en loading
  - Identité centrée + `ProfileNameDisplay` avec `isPremium`
  - Stats en `grid-cols-3` + `profileNestedClass`
  - Mutual text via `friendSuggestionMutualOne/Many`
  - Actions conservées

- [x] **Step 3: Vérifier lint / typecheck ciblé si possible**
