# Home Mockup Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner le rendu de l’accueil sur les maquettes `docs/redesign-accueil/screens/10`–`36` via un kit UI home partagé, sans nouvelle API.

**Architecture:** Créer `HomeExerciseList` (modes `live` / `past`), revoir `HomeRecapTeaser` (hero photo) et `HomeWeekStrip` (série perdue = check lime), brancher live + passé dessus, puis polish densités / empty states / CTA. Thème clair = référence ; sombre = tokens existants.

**Tech Stack:** React, Tailwind, SWR hooks existants, Playwright smoke, `UI` translations.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-10-09-home-mockup-fidelity-design.md`
- Référence visuelle : `docs/redesign-accueil/screens/10`–`36` + `HANDOFF.md` section Accueil
- Ne pas copier le HTML du prototype
- Aucun `--` ni `—` dans le copy utilisateur (`.cursor/rules/copywriting-french.mdc`)
- Texte accent : `accent-text`, jamais `text-accent` sur du texte
- Réutiliser `ExerciseImage`, `ExerciseTitle`, `RankBadge`, `AddPerfDrawer`, `EmptyState`, `SessionCommentsThread`, `ReactionBubbles`
- Pas de nouvelle API ; pas de refonte `SessionLiveBar` (checklist visuelle seulement)
- Ne pas committer sauf demande explicite de l’utilisateur

## File Structure

| File | Responsibility |
|---|---|
| `client/src/components/home/HomeExerciseList.tsx` | Liste unique carte blanche, modes live/past |
| `client/src/components/home/HomeLiveSession.tsx` | Titre + chrono + liste live + add exo + drawers |
| `client/src/components/home/HomePastSession.tsx` | Titre + teaser + liste past + commentaires |
| `client/src/components/home/HomeRecapTeaser.tsx` | Teaser récap avec hero photo |
| `client/src/components/home/HomeWeekStrip.tsx` | Bulles semaine + mode série perdue |
| `client/src/components/home/HomeProgressWeekCard.tsx` | Passe `streakLost` à la strip |
| `client/src/components/home/HomeFirstSessionCard.tsx` | Densités vs `10`–`12` |
| `client/src/components/home/HomeStartSessionCta.tsx` | Densités CTA |
| `client/src/components/home/HomeDayContent.tsx` | Empty states densités si besoin |
| `client/e2e/smoke/home/*.spec.ts` | Smoke structure / première séance / passé |

---

### Task 1: `HomeExerciseList` + branchement live

**Files:**
- Create: `client/src/components/home/HomeExerciseList.tsx`
- Modify: `client/src/components/home/HomeLiveSession.tsx`
- Test: smoke existant + typecheck ; vérifier manuellement capture `20` / `23`

**Interfaces:**
- Produces:
```ts
import type { HistoryEntryInsight } from "@/lib/history-entries";
import type { ReactionBubble } from "@/lib/session-api";
import type { LeagueInfo } from "@/lib/strength-standards";
import type { PerformanceEntry, TrackedExercise } from "@/types";

export type HomeExerciseListMode = "live" | "past";

export type HomeExerciseListGroup = {
  trackedExerciseId: string;
  items: PerformanceEntry[];
  exercise: TrackedExercise | undefined;
  league: LeagueInfo | null;
  seriesLabel: string;
  reactions?: ReactionBubble[];
};

export type HomeExerciseListProps = {
  mode: HomeExerciseListMode;
  groups: HomeExerciseListGroup[];
  entryInsights: Map<string, HistoryEntryInsight>;
  onOpenExercise: (trackedExerciseId: string) => void;
  onAddSet?: (trackedExerciseId: string) => void;
  onEditEntry?: (entry: PerformanceEntry) => void;
  currentUserId?: string | null;
  onToggleReaction?: (trackedExerciseId: string, emoji: string) => void;
};
```
- Consumes (live) : groupes déjà construits dans `HomeLiveSession`, drawers restent dans le parent

- [ ] **Step 1: Créer `HomeExerciseList.tsx`**

Une `Card` `gap-0 py-0` ; `ul.divide-y` ; chaque ligne :

- vignette `size-14 rounded-xl` → `onOpenExercise`
- zone nom (bouton) → toggle expand local (`useState<Set<string>>`)
- méta : puce séries `bg-muted` + `RankBadge` si `league`
- action droite :
  - `live` : `Button` rond noir `+` → `onAddSet`
  - `past` : `ChevronDown` (rotation si ouvert) ; pas de `+`
- panel ouvert : liste séries `bg-secondary/60`, label `formatPerfLabel`, pastille Record via `accent-text` si `insight?.isRecord`, crayon seulement si `mode === "live"` et `onEditEntry`
- `ReactionBubbles` si `reactions?.length`

S’inspirer du JSX actuel de `HomeLiveSession` (lignes liste / séries), sans drawers.

- [ ] **Step 2: Brancher `HomeLiveSession`**

Remplacer le `<Card>…</Card>` d’exercices par :

```tsx
<HomeExerciseList
  mode="live"
  groups={groups.map(({ trackedExerciseId, items }) => {
    const exercise = resolveExercise(trackedExerciseId);
    const seriesLabel =
      items.length === 1
        ? UI.homeLiveSeriesOne
        : UI.historySeriesCount.replace("{count}", String(items.length));
    return {
      trackedExerciseId,
      items,
      exercise,
      league: resolveLeague(trackedExerciseId),
      seriesLabel,
      reactions: session?.reactionsByExerciseId?.[trackedExerciseId],
    };
  })}
  entryInsights={entryInsights}
  onOpenExercise={(id) => {
    void hapticImpact();
    navigate(`/exercise/${id}`);
  }}
  onAddSet={(id) => {
    void hapticImpact();
    setAddFor(id);
  }}
  onEditEntry={setEditEntry}
  currentUserId={currentUserId}
  onToggleReaction={(id, emoji) => {
    void hapticImpact();
    void handleToggleReaction(id, emoji);
  }}
/>
```

Supprimer le state `expanded` local et le JSX liste dupliqué. Garder titre, CTA « Ajouter un exercice », commentaires, drawers.

- [ ] **Step 3: Vérifier**

Run: `npm run typecheck:gate --prefix client`  
Expected: PASS

Comparer mentalement à `screens/20-accueil-seance-en-cours.png` et `23-accueil-seance-exo-deplie.png` (une carte, `+` noir, Record lime).

---

### Task 2: Brancher `HomePastSession` sur `HomeExerciseList`

**Files:**
- Modify: `client/src/components/home/HomePastSession.tsx`
- Test: typecheck ; checklist `30` / `31` / `35`

**Interfaces:**
- Consumes: `HomeExerciseList` (`mode="past"`)
- Ne plus utiliser `HistoryDaySection` pour l’accueil

- [ ] **Step 1: Remplacer la liste**

Après chargement session, construire les groupes depuis `dayGroups` (déjà `groupByDayThenExercise`) :

```tsx
import { HomeExerciseList } from "@/components/home/HomeExerciseList";
import { RankBadge } /* only if needed elsewhere */ from "@/components/RankBadge";
import type { LeagueInfo } from "@/lib/strength-standards";

// Dans le render, à la place de <ul>…HistoryDaySection…</ul> :
const pastGroups = dayGroups.flatMap(({ exercises }) =>
  exercises.map(({ trackedExerciseId, items }) => {
    const exercise = resolveExercise(trackedExerciseId);
    const fromSession = sessionExercises.find(
      (ex) => ex.id === trackedExerciseId,
    );
    const league = fromSession?.league ?? null;
    const seriesLabel =
      items.length === 1
        ? UI.homeLiveSeriesOne
        : UI.historySeriesCount.replace("{count}", String(items.length));
    return {
      trackedExerciseId,
      items,
      exercise,
      league: league ?? null,
      seriesLabel,
      reactions: session?.reactionsByExerciseId?.[trackedExerciseId],
    };
  }),
);

// ...
<HomeExerciseList
  mode="past"
  groups={pastGroups}
  entryInsights={entryInsights}
  onOpenExercise={(id) => {
    void navigate(`/exercise/${id}`);
  }}
  currentUserId={currentUserId}
  onToggleReaction={
    /* même pattern que live si réactions présentes, sinon omettre */
    undefined
  }
/>
```

Si `sessionExercises` expose déjà `league`, l’utiliser ; sinon `league: null` (badge absent, acceptable).

Retirer l’import `HistoryDaySection` et le `noop` d’édition.

- [ ] **Step 2: Vérifier**

Run: `npm run typecheck:gate --prefix client`  
Expected: PASS

Checklist : une seule carte blanche, chevron à droite (pas `+`), teaser au-dessus inchangé pour l’instant.

---

### Task 3: `HomeRecapTeaser` hero photo

**Files:**
- Modify: `client/src/components/home/HomeRecapTeaser.tsx`
- Asset: réutiliser `/images/first-session-hero.jpg` (constante locale)

**Interfaces:**
- Props inchangées
- Visuel : fond image + gradient → texte lime / blanc + barres

- [ ] **Step 1: Mettre à jour le markup**

```tsx
const RECAP_HERO_SRC = "/images/first-session-hero.jpg";

// Remplacer le Link plat bg-black par :
<Link
  to={`/session/${ownerUserId}/${dayKey}`}
  /* …handlers / aria inchangés… */
  className="dark relative flex min-h-[112px] items-center gap-4 overflow-hidden rounded-2xl bg-[#0a0a0a] p-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  <img
    src={RECAP_HERO_SRC}
    alt=""
    className="absolute inset-0 size-full select-none object-cover object-[50%_35%] opacity-50"
    draggable={false}
    loading="lazy"
    decoding="async"
  />
  <span
    aria-hidden
    className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40"
  />
  <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-2">
    {/* label accent-text, headline, CTA inchangés */}
  </span>
  {/* barres volume : relative z-10 */}
</Link>
```

Pas de nouveau string `UI` sauf si le CTA maquette diffère (garder `UI.homeRecapCta`).

- [ ] **Step 2: Vérifier**

Comparer à `screens/30` / `33` (label lime « Récap de séance », dernière barre lime).

---

### Task 4: Semaine · série perdue (check lime)

**Files:**
- Modify: `client/src/components/home/HomeWeekStrip.tsx`
- Modify: `client/src/components/home/HomeProgressWeekCard.tsx`
- Test: checklist `36` + `35` (risque inchangé)

**Interfaces:**
- Ajouter prop `streakLost?: boolean` sur `HomeWeekStrip`
- `HomeProgressWeekCard` passe `streakLost={streak.kind === "none"}`

- [ ] **Step 1: Bulles actives en mode perdu**

Dans `DayBubble`, accepter `lost: boolean`. Si `cell.active && lost` :

```tsx
import { Check, Flame } from "lucide-react";

// bulle active + lost :
<span className={cn(base, "bg-accent text-accent-foreground")}>
  <Check className="size-4" strokeWidth={3} aria-hidden />
</span>
```

Sinon garder flamme orange actuelle. Aujourd’hui à risque : logique `atRisk` existante inchangée. Ne pas combiner `lost` et flammes orange.

- [ ] **Step 2: Brancher depuis `HomeProgressWeekCard`**

```tsx
<HomeWeekStrip
  /* …props existantes… */
  todayAtRisk={streak.kind === "risk"}
  streakLost={streak.kind === "none"}
/>
```

Le slot streak `StreakSummary` pour `kind === "none"` (flamme grise + 0) est déjà en place : ne pas afficher `StreakFlameCount` avec bonus. `StreakNote` retourne déjà `null` si pas active/risk.

- [ ] **Step 3: Vérifier**

Checklist `36-accueil-serie-perdue.png` : check lime sur jours actifs, flamme grise à droite du niveau, pas de `+10% XP`.  
Checklist `35` : bandeau orange + countdown toujours OK.

---

### Task 5: Polish densités (première séance, empty, CTA, titres)

**Files:**
- Modify: `client/src/components/home/HomeFirstSessionCard.tsx`
- Modify: `client/src/components/home/HomeStartSessionCta.tsx`
- Modify: `client/src/components/home/HomeDayTitle.tsx` only if the section title size diverges from captures after Tasks 1–4
- Modify: `client/src/components/home/HomeDayContent.tsx` — `EmptyState` `contentClassName` (`px-6 py-8` today-empty ; `px-6 py-6` rest/future)
- Modify: `client/src/components/home/HomeLastSessionBlock.tsx` — keep `mt-8` unless capture `33` shows tighter gap (then `mt-6`)
- Réf : `screens/10`, `11`, `12`, `32`, `33`, `34`

**Interfaces:** aucun nouveau contrat ; ajustements className uniquement

- [ ] **Step 1: Première séance**

Aligner sur `10` : hero ~120px déjà OK ; titre deux lignes avec 2ᵉ ligne `accent-text` ; CTA `variant="accent"` pleine largeur ; tag « Pas de rappel » / « Rappel activé ». Corriger seulement les écarts visibles (padding `px-4 pb-4`, taille titre `text-[26px]`).

- [ ] **Step 2: Empty + CTA**

- Empty aujourd’hui : titre `UI.homeTodayEmptyTitle`, aide `UI.homeTodayEmptyHelp`, icône haltère, padding généreux (`py-8`)
- CTA : `h-11` / `h-12`, `font-one-more uppercase italic`, icône `Play` remplie, libellé `UI.homeStartSession`
- Titres section : `font-one-more text-sm uppercase italic` (déjà dans `HomeDayTitle`)

- [ ] **Step 3: Checklist visuelle rapide**

Parcourir `10`–`12`, `32`–`34`, `33` contre le rendu thème clair.

---

### Task 6: Smoke e2e + done criteria

**Files:**
- Modify si besoin : `client/e2e/smoke/home/home-structure.spec.ts`
- Modify si besoin : `client/e2e/smoke/home/home-first-session-card.spec.ts`
- Create: `client/e2e/smoke/home/home-past-session-list.spec.ts` only if Task 2 changes break structure smoke and a past-day mock is needed; otherwise skip this file

- [ ] **Step 1: Lancer les smoke home**

Run: `npx playwright test e2e/smoke/home --prefix client`  
Expected: PASS. If FAIL on missing role/text, update selectors to `UI.*` strings only (no invented copy).

- [ ] **Step 2: Typecheck + lint ciblé**

Run: `npm run typecheck:gate --prefix client`  
Expected: PASS

- [ ] **Step 3: Checklist done (manuel)**

Pour chaque PNG `10`–`36` : cocher écarts résiduels. Accepter seulement : différences de données fictives prototype, thème sombre non pixel-match, barre live hors polish structurel.

- [ ] **Step 4: Commit seulement si l’utilisateur le demande**

Message suggéré :

```text
fix(home): aligner l'accueil sur les maquettes 10–36
```

---

## Spec coverage (self-review)

| Spec | Task |
|---|---|
| `HomeExerciseList` live/past | 1, 2 |
| `HomeRecapTeaser` hero | 3 |
| Week strip série perdue | 4 |
| Streak note / flamme grise | 4 (existant + prop) |
| États `10`–`12`, `32`–`34`, empty, CTA | 5 |
| Smoke + critère done | 6 |
| Hors scope API / Récap page / Social | respecté |
| SessionLiveBar checklist only | Task 6 checklist + contrainte globale |
