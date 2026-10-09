# Bottom Nav Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner la bottom nav sur les maquettes (4 onglets Accueil · Exercices · Social · Réglages, labels, pastille lime, badge Social).

**Architecture:** Réécrire `BottomNav` (items + matching actif parent + labels), étendre `BottomNavHost` (`/exercises`, `/settings`), adapter `HomeTour` + strings `UI`, smoke e2e dédié. Pas de refonte des pages Social / Exercices.

**Tech Stack:** React, React Router, lucide-react, Tailwind, Playwright smoke, `UI` translations.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-10-09-bottom-nav-redesign-design.md`
- Aucun `--` ni `—` dans le copy (`.cursor/rules/copywriting-french.mdc`)
- Accent : pastille `bg-accent` + icône `text-accent-foreground` ; pas de `text-accent` sur du texte
- Safe area : conserver `pb/pl/pr` via `var(--safe-*)` sur la nav
- Ne pas committer sauf demande explicite de l’utilisateur
- Hors scope : contenu `SocialPage` / `ExerciseListPage`, redirect `/history`, nav sur `/exercise/:id`

## File Structure

| File | Responsibility |
|---|---|
| `client/src/components/BottomNav.tsx` | 4 onglets, labels, pastille, badge, actif parent |
| `client/src/App.tsx` | `BottomNavHost` : routes où la nav s’affiche |
| `client/src/index.css` | `--bottom-nav-height` si besoin (~4.5rem) |
| `client/src/lib/translations.ts` | `navSettings`, tours nav Exercices/Réglages, aria |
| `client/src/components/HomeTour.tsx` | Cibles `nav-exercises` / `nav-social` / `nav-settings` |
| `client/e2e/smoke/nav/bottom-nav.spec.ts` | Smoke 4 onglets + navigation |

---

### Task 1: `BottomNav` + host + hauteur

**Files:**
- Modify: `client/src/components/BottomNav.tsx`
- Modify: `client/src/App.tsx` (`BottomNavHost`)
- Modify: `client/src/index.css` (`--bottom-nav-height`)
- Modify: `client/src/lib/translations.ts` (`navSettings` si absent)

**Interfaces:**
- Produces: `NAV_ITEMS` = `/home`, `/exercises`, `/social`, `/settings` avec `data-tour` `nav-home` | `nav-exercises` | `nav-social` | `nav-settings`
- Actif : Accueil aussi sur `/profile` ; Social aussi sur `/ranking` et `/friends` (+ préfixe) ; badge sur Social via `useFriendsBadgeCount`

- [ ] **Step 1: Ajouter `UI.navSettings`**

Dans `translations.ts`, près de `navSocial` :

```ts
navSettings: "Réglages",
```

Réutiliser `UI.navFriendsBadgeAria` pour le badge Social (label = Social).

- [ ] **Step 2: Réécrire `BottomNav.tsx`**

```tsx
import { Dumbbell, Home, Settings, Users } from 'lucide-react'
// ...
const NAV_ITEMS = [
  { to: '/home', label: 'Accueil', tourId: 'nav-home', Icon: Home },
  { to: '/exercises', label: UI.exercises /* ou "Exercices" */, tourId: 'nav-exercises', Icon: Dumbbell },
  { to: '/social', label: UI.navSocial, tourId: 'nav-social', Icon: Users },
  { to: '/settings', label: UI.navSettings, tourId: 'nav-settings', Icon: Settings },
]

function isNavItemActive(pathname: string, to: string): boolean {
  if (to === '/home') return pathname === '/home' || pathname === '/profile'
  if (to === '/exercises') return pathname === '/exercises'
  if (to === '/social') {
    return (
      pathname === '/social' ||
      pathname === '/ranking' ||
      pathname === '/friends' ||
      pathname.startsWith('/friends/')
    )
  }
  if (to === '/settings') return pathname === '/settings'
  return pathname === to
}
```

Rendu : pastille `h-8 w-12 rounded-[10px]` + `bg-accent` si actif ; label `text-[10px]` sous l’icône ; badge Social si `friendsBadge > 0`.

Corriger le bug actuel `w-` tronqué dans la className.

- [ ] **Step 3: Étendre `BottomNavHost`**

Ajouter à `show` :

```ts
location.pathname === '/exercises' ||
location.pathname === '/settings' ||
```

Conserver profile / ranking / friends / history / stats.

- [ ] **Step 4: Hauteur CSS**

Passer `--bottom-nav-height` à `4.5rem` (72px prototype) si les labels débordent avec 4rem.

- [ ] **Step 5: Vérifier typecheck**

Run: `npx tsc -p client --noEmit` (ou script repo équivalent)  
Expected: OK sur fichiers touchés

---

### Task 2: `HomeTour` + copy

**Files:**
- Modify: `client/src/components/HomeTour.tsx`
- Modify: `client/src/lib/translations.ts`

**Interfaces:**
- Consumes: `data-tour="nav-exercises" | "nav-social" | "nav-settings"` de Task 1
- Remplace steps `nav-profile`, `nav-history`, `nav-friends`

- [ ] **Step 1: Remplacer strings tour**

Supprimer ou cesser d’utiliser `homeTourNavProfile*` / `homeTourNavHistory*` / `homeTourNavFriends*`. Ajouter :

```ts
homeTourNavExercisesTitle: "Exercices",
homeTourNavExercisesContent:
  "Retrouve tes exercices suivis et le catalogue par zone du corps.",
homeTourNavSettingsTitle: "Réglages",
homeTourNavSettingsContent:
  "Compte, notifications, salle, temps de repos et apparence.",
```

Garder `homeTourNavSocialTitle` / `Content` (déjà OK pour le nouvel onglet).

Aucun `--` / `—` dans ces chaînes.

- [ ] **Step 2: Mettre à jour `HomeTour.tsx`**

Remplacer le bloc des 4 steps nav par :

```ts
{
  target: '[data-tour="nav-exercises"]',
  title: UI.homeTourNavExercisesTitle,
  content: UI.homeTourNavExercisesContent,
  placement: "top",
  skipScroll: true,
  floatingOptions: { shiftOptions: { padding: getJoyrideShiftPadding() } },
},
{
  target: '[data-tour="nav-social"]',
  title: UI.homeTourNavSocialTitle,
  content: UI.homeTourNavSocialContent,
  placement: "top",
  skipScroll: true,
  floatingOptions: { shiftOptions: { padding: getJoyrideShiftPadding() } },
},
{
  target: '[data-tour="nav-settings"]',
  title: UI.homeTourNavSettingsTitle,
  content: UI.homeTourNavSettingsContent,
  placement: "top",
  skipScroll: true,
  floatingOptions: { shiftOptions: { padding: getJoyrideShiftPadding() } },
},
```

`RankingTour` inchangé (`nav-social`).

---

### Task 3: Smoke e2e nav

**Files:**
- Create: `client/e2e/smoke/nav/bottom-nav.spec.ts`
- Modify: `docs/quality-gates.md` (ajouter le chemin du spec)

**Interfaces:**
- Consumes: labels Accueil / Exercices / Social / Réglages ; helpers `seedAuthenticatedSession`, `seedOnboardingDone`, `trackPageErrors`, `mockAuthApi` (ou équivalent)

- [ ] **Step 1: Écrire le spec**

```ts
import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  mockAuthApi,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";

test("bottom nav : 4 onglets et navigation", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthApi(page);

  await page.goto("/#/home");

  const nav = page.getByRole("navigation", { name: "Navigation" });
  await expect(nav.getByRole("link", { name: "Accueil" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Exercices" })).toBeVisible();
  await expect(nav.getByRole("link", { name: UI.navSocial })).toBeVisible();
  await expect(nav.getByRole("link", { name: UI.navSettings })).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(4);

  await nav.getByRole("link", { name: "Exercices" }).click();
  await expect(page).toHaveURL(/#\/exercises/);

  await nav.getByRole("link", { name: UI.navSocial }).click();
  await expect(page).toHaveURL(/#\/social/);

  await nav.getByRole("link", { name: UI.navSettings }).click();
  await expect(page).toHaveURL(/#\/settings/);

  await nav.getByRole("link", { name: "Accueil" }).click();
  await expect(page).toHaveURL(/#\/home/);

  expect(pageErrors).toEqual([]);
});
```

Vérifier que `UI.exercises` (ou libellé exact) match le label du lien. Si le badge aria change le `name` accessible, utiliser `exact` / filtre.

- [ ] **Step 2: Lancer le smoke**

Run: `npx playwright test e2e/smoke/nav/bottom-nav.spec.ts --prefix client`  
(ou `npm run test:smoke --prefix client -- e2e/smoke/nav/bottom-nav.spec.ts`)  
Expected: PASS

- [ ] **Step 3: Mettre à jour `docs/quality-gates.md`**

Ajouter une ligne pour `client/e2e/smoke/nav/bottom-nav.spec.ts`.

---

## Spec coverage

| Spec | Task |
|---|---|
| 4 onglets + labels + pastille | Task 1 |
| Actif parent (profile / friends / ranking) | Task 1 |
| Visibilité `/exercises` + `/settings` | Task 1 |
| Badge Social nav | Task 1 |
| Badge header Social | déjà en place ; pas de changement |
| HomeTour cibles | Task 2 |
| `--bottom-nav-height` | Task 1 |
| Smoke + lint | Task 3 |
| Hors scope pages | respecté |
