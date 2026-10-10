# History & Profile Session Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher l’historique et le profil comme un feed de séances first-class (séparées même le même jour), avec les composants accueil et un récap compact.

**Architecture:** Fonction pure `buildSessionFeedItems` + hook `useSessionsFeed` (Promise.all sur `fetchDaySessions` par jour) + composant `SessionFeed` qui rend `HomePastSession`. `HomeRecapTeaser` gagne `variant="compact"` pour historique/profil uniquement.

**Tech Stack:** React, SWR, TypeScript, Vitest (tests lib), Playwright smoke optionnel.

**Spec:** [`docs/superpowers/specs/2026-10-09-history-profile-session-feed-design.md`](../specs/2026-10-09-history-profile-session-feed-design.md)

## Global Constraints

- Copy UI : pas de `--` / `—` dans les chaînes affichées (règle copywriting-français).
- Accueil (`HomePage`, `HomeDaySessions`) inchangé sauf props optionnelles à défaut.
- Pas de nouvel endpoint API ; réutiliser `GET /sessions/:ownerUserId/day/:date`.
- Lecture seule sur historique/profil (pas d’AddPerfDrawer / edit inline).
- Profil : max **2** séances + lien Voir tout.
- Commits uniquement si l’utilisateur le demande explicitement (sinon skip les steps commit).

## File map

| Fichier | Responsabilité |
|---|---|
| Create `client/src/lib/session-feed.ts` | `collectDayKeysFromEntries`, `buildSessionFeedItems`, types |
| Create `client/src/lib/session-feed.test.ts` | Tests unitaires du feed |
| Create `client/src/hooks/use-sessions-feed.ts` | SWR multi-jours → items triés |
| Create `client/src/components/session/SessionFeed.tsx` | Liste `HomePastSession` + skeleton |
| Modify `client/src/components/home/HomeRecapTeaser.tsx` | Prop `variant` compact |
| Modify `client/src/components/home/HomePastSession.tsx` | Prop `recapVariant` |
| Modify `client/src/pages/HistoryPage.tsx` | Remplacer `HistoryDaySection` par `SessionFeed` |
| Modify `client/src/components/profile/ProfileRecentHistory.tsx` | Idem, limit 2 |
| Keep (unused OK) | `HistoryDaySection`, `HistoryExerciseCollapsible` (cleanup hors plan) |

---

### Task 1: Lib `session-feed` + tests

**Files:**
- Create: `client/src/lib/session-feed.ts`
- Create: `client/src/lib/session-feed.test.ts`

**Interfaces:**
- Consumes: `DaySessionSummary` (`@/lib/session-api`), `PerformanceEntry` (`@/types`), `formatHomeDayTitle` (`@/lib/home-day`), `formatTimeOnly` (`@/lib/history-entries`)
- Produces:
  - `SessionFeedItem = DaySessionSummary & { title: string }`
  - `collectDayKeysFromEntries(entries: PerformanceEntry[]): string[]`
  - `buildSessionFeedItems(days: { dayKey: string; items: DaySessionSummary[] }[]): SessionFeedItem[]`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  buildSessionFeedItems,
  collectDayKeysFromEntries,
} from "@/lib/session-feed";
import type { DaySessionSummary } from "@/lib/session-api";
import type { PerformanceEntry } from "@/types";

function entry(partial: Partial<PerformanceEntry> & Pick<PerformanceEntry, "id" | "date">): PerformanceEntry {
  return {
    trackedExerciseId: "ex-1",
    weight: 60,
    reps: 8,
    createdAt: `${partial.date}T10:00:00.000Z`,
    updatedAt: `${partial.date}T10:00:00.000Z`,
    ...partial,
  };
}

function session(
  partial: Pick<DaySessionSummary, "id" | "date" | "startedAt"> &
    Partial<DaySessionSummary>,
): DaySessionSummary {
  return {
    endedAt: null,
    isLive: false,
    ...partial,
  };
}

describe("collectDayKeysFromEntries", () => {
  it("returns distinct dates newest first", () => {
    const keys = collectDayKeysFromEntries([
      entry({ id: "a", date: "2026-10-01" }),
      entry({ id: "b", date: "2026-10-09" }),
      entry({ id: "c", date: "2026-10-09" }),
      entry({ id: "d", date: "2026-10-05", deletedAt: "2026-10-05T12:00:00.000Z" }),
    ]);
    expect(keys).toEqual(["2026-10-09", "2026-10-01"]);
  });
});

describe("buildSessionFeedItems", () => {
  it("flattens sessions newest first and splits same-day titles", () => {
    const items = buildSessionFeedItems([
      {
        dayKey: "2026-10-09",
        items: [
          session({
            id: "s-morning",
            date: "2026-10-09",
            startedAt: "2026-10-09T08:00:00.000Z",
          }),
          session({
            id: "s-evening",
            date: "2026-10-09",
            startedAt: "2026-10-09T18:00:00.000Z",
          }),
        ],
      },
      {
        dayKey: "2026-10-08",
        items: [
          session({
            id: "s-prev",
            date: "2026-10-08",
            startedAt: "2026-10-08T12:00:00.000Z",
          }),
        ],
      },
    ]);

    expect(items.map((item) => item.id)).toEqual([
      "s-evening",
      "s-morning",
      "s-prev",
    ]);
    // Newest of each day → day title; older same day → time only
    expect(items[0]!.title.length).toBeGreaterThan(0);
    expect(items[1]!.title).not.toEqual(items[0]!.title);
    expect(items[2]!.title.length).toBeGreaterThan(0);
  });

  it("skips empty days", () => {
    expect(
      buildSessionFeedItems([{ dayKey: "2026-10-09", items: [] }]),
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --prefix client -- src/lib/session-feed.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement `session-feed.ts`**

```ts
import { formatTimeOnly } from "@/lib/history-entries";
import { formatHomeDayTitle } from "@/lib/home-day";
import type { DaySessionSummary } from "@/lib/session-api";
import type { PerformanceEntry } from "@/types";

export type SessionFeedItem = DaySessionSummary & {
  title: string;
};

/** Jours distincts des perfs actives, plus récents d'abord. */
export function collectDayKeysFromEntries(
  entries: PerformanceEntry[],
): string[] {
  const keys = new Set<string>();
  for (const entry of entries) {
    if (entry.deletedAt) continue;
    keys.add(entry.date);
  }
  return [...keys].sort((a, b) => b.localeCompare(a));
}

/**
 * Aplatit les séances de plusieurs jours, tri `startedAt` desc.
 * Titre : plus récente du jour → `formatHomeDayTitle` ; sinon heure.
 * (Même convention que `HomeDaySessions`.)
 */
export function buildSessionFeedItems(
  days: { dayKey: string; items: DaySessionSummary[] }[],
): SessionFeedItem[] {
  const flat: DaySessionSummary[] = [];
  for (const { items } of days) {
    for (const item of items) flat.push(item);
  }

  flat.sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  const newestIdByDay = new Map<string, string>();
  for (const item of flat) {
    if (!newestIdByDay.has(item.date)) {
      newestIdByDay.set(item.date, item.id);
    }
  }

  return flat.map((item) => ({
    ...item,
    title:
      newestIdByDay.get(item.date) === item.id
        ? formatHomeDayTitle(item.date)
        : formatTimeOnly(item.startedAt),
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --prefix client -- src/lib/session-feed.test.ts`

Expected: PASS

- [ ] **Step 5: Commit** (si demandé)

```bash
git add client/src/lib/session-feed.ts client/src/lib/session-feed.test.ts
git commit -m "$(cat <<'EOF'
feat: add session feed helpers for history and profile

EOF
)"
```

---

### Task 2: Hook `useSessionsFeed`

**Files:**
- Create: `client/src/hooks/use-sessions-feed.ts`

**Interfaces:**
- Consumes: `fetchDaySessions` (`@/lib/session-api`), `buildSessionFeedItems` (`@/lib/session-feed`)
- Produces: `useSessionsFeed(ownerUserId, dayKeys, enabled?)` → SWR `{ data: SessionFeedItem[] | undefined, isLoading, error }`

- [ ] **Step 1: Implement the hook**

```ts
import {
  buildSessionFeedItems,
  type SessionFeedItem,
} from "@/lib/session-feed";
import { fetchDaySessions } from "@/lib/session-api";
import useSWR from "swr";

export function sessionsFeedSwrKey(
  ownerUserId: string,
  dayKeys: string[],
) {
  return ["sessions-feed", ownerUserId, ...dayKeys] as const;
}

export function useSessionsFeed(
  ownerUserId: string | undefined,
  dayKeys: string[],
  enabled = true,
) {
  const key =
    enabled && ownerUserId && dayKeys.length > 0
      ? sessionsFeedSwrKey(ownerUserId, dayKeys)
      : null;

  return useSWR<SessionFeedItem[]>(key, async () => {
    const results = await Promise.all(
      dayKeys.map(async (dayKey) => {
        try {
          const { items } = await fetchDaySessions(ownerUserId!, dayKey);
          return { dayKey, items };
        } catch {
          // Un jour en erreur ne bloque pas le feed.
          return { dayKey, items: [] as Awaited<
            ReturnType<typeof fetchDaySessions>
          >["items"] };
        }
      }),
    );
    return buildSessionFeedItems(results);
  });
}
```

- [ ] **Step 2: Typecheck smoke**

Run: `npx tsc --noEmit -p client` (ou la commande typecheck du monorepo si différente)

Expected: pas d’erreur sur ce fichier

- [ ] **Step 3: Commit** (si demandé)

```bash
git add client/src/hooks/use-sessions-feed.ts
git commit -m "$(cat <<'EOF'
feat: add useSessionsFeed hook for multi-day session lists

EOF
)"
```

---

### Task 3: `HomeRecapTeaser` variant compact + `HomePastSession`

**Files:**
- Modify: `client/src/components/home/HomeRecapTeaser.tsx`
- Modify: `client/src/components/home/HomePastSession.tsx`

**Interfaces:**
- Consumes: classes Tailwind existantes
- Produces:
  - `HomeRecapTeaserProps.variant?: "default" | "compact"` (défaut `"default"`)
  - `HomePastSessionProps.recapVariant?: "default" | "compact"` (défaut `"default"`)

- [ ] **Step 1: Ajouter `variant` sur `HomeRecapTeaser`**

Étendre les props :

```ts
type HomeRecapTeaserProps = {
  // ...existants
  variant?: "default" | "compact";
};
```

Dans le composant (`variant = "default"`) :

- `default` : classes actuelles (`min-h-[112px]`, `p-4`, bars `MAX_BAR_HEIGHT_PX = 52`, headline `text-lg`, etc.)
- `compact` :
  - Link : `min-h-[72px] gap-3 p-3` (garder le reste dark / rounded-xl)
  - Label : `text-[10px]`
  - Headline : `text-base`
  - CTA : `text-xs`
  - Bars : hauteur max **32** (`MAX_BAR_HEIGHT_COMPACT_PX`), conteneur `h-[32px]`, `w-1.5`

Exemple de branchement :

```tsx
const compact = variant === "compact";
const maxBar = compact ? 32 : 52;
// bars: Math.max(compact ? 4 : 6, Math.round((volume / max) * maxBar))

className={cn(
  "dark relative flex items-center overflow-hidden rounded-xl bg-[#0a0a0a] text-white outline-none focus-visible:ring-2 focus-visible:ring-ring",
  compact ? "min-h-[72px] gap-3 p-3" : "min-h-[112px] gap-4 p-4",
)}
```

Ne pas changer le copy (`UI.homeRecap*`).

- [ ] **Step 2: Passer `recapVariant` depuis `HomePastSession`**

```ts
type HomePastSessionProps = {
  // ...existants
  recapVariant?: "default" | "compact";
};

// dans le JSX
<HomeRecapTeaser
  ...
  variant={recapVariant ?? "default"}
/>
```

- [ ] **Step 3: Vérifier l’accueil**

Aucun appel existant ne passe `variant` / `recapVariant` → rendu inchangé.

- [ ] **Step 4: Commit** (si demandé)

```bash
git add client/src/components/home/HomeRecapTeaser.tsx client/src/components/home/HomePastSession.tsx
git commit -m "$(cat <<'EOF'
feat: add compact HomeRecapTeaser variant for session feeds

EOF
)"
```

---

### Task 4: Composant `SessionFeed`

**Files:**
- Create: `client/src/components/session/SessionFeed.tsx`

**Interfaces:**
- Consumes: `useSessionsFeed`, `HomePastSession`, `ExerciseCardSkeletonList`, `collectDayKeysFromEntries`
- Produces: `SessionFeed({ ownerUserId, entries, limit?, recapVariant?, className? })`

- [ ] **Step 1: Implement `SessionFeed`**

```tsx
import { HomePastSession } from "@/components/home/HomePastSession";
import { ExerciseCardSkeletonList } from "@/components/skeletons";
import { useSessionsFeed } from "@/hooks/use-sessions-feed";
import { getActivityDayKey } from "@/lib/activity-from-performances";
import { collectDayKeysFromEntries } from "@/lib/session-feed";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry } from "@/types";
import { useMemo } from "react";

type SessionFeedProps = {
  ownerUserId: string;
  /** Perfs actives (ou déjà filtrées) de l'owner. */
  entries: PerformanceEntry[];
  /** Limite le nombre de séances affichées (profil = 2). */
  limit?: number;
  recapVariant?: "default" | "compact";
  className?: string;
};

export function SessionFeed({
  ownerUserId,
  entries,
  limit,
  recapVariant = "compact",
  className,
}: SessionFeedProps) {
  const dayKeys = useMemo(
    () => collectDayKeysFromEntries(entries),
    [entries],
  );
  const { data: items, isLoading, error } = useSessionsFeed(
    ownerUserId,
    dayKeys,
  );

  const shown = useMemo(() => {
    const list = items ?? [];
    return limit != null ? list.slice(0, limit) : list;
  }, [items, limit]);

  if (isLoading && !items) {
    return <ExerciseCardSkeletonList count={3} compact />;
  }

  if (error && shown.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{UI.sessionUnavailable}</p>
    );
  }

  if (shown.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {shown.map((item) => {
        const dayEntries = entries.filter(
          (entry) =>
            !entry.deletedAt && getActivityDayKey(entry) === item.date,
        );
        return (
          <HomePastSession
            key={item.id}
            ownerUserId={ownerUserId}
            dayKey={item.date}
            sessionId={item.id}
            dayEntries={dayEntries}
            allEntries={entries}
            title={item.title}
            recapVariant={recapVariant}
          />
        );
      })}
    </div>
  );
}
```

Note : utiliser `getActivityDayKey` pour rester aligné avec l’accueil si le jour activité ≠ `entry.date` dans certains cas ; si le projet considère `entry.date` comme source de vérité historique, filtrer sur `entry.date === item.date` (même chose que `HistoryPage` aujourd’hui). Préférer **`entry.date === item.date`** pour coller à `collectDayKeysFromEntries` et éviter un mismatch.

Version filtre recommandée :

```ts
const dayEntries = entries.filter(
  (entry) => !entry.deletedAt && entry.date === item.date,
);
```

- [ ] **Step 2: Commit** (si demandé)

```bash
git add client/src/components/session/SessionFeed.tsx
git commit -m "$(cat <<'EOF'
feat: add SessionFeed list component

EOF
)"
```

---

### Task 5: Brancher `HistoryPage`

**Files:**
- Modify: `client/src/pages/HistoryPage.tsx`

**Interfaces:**
- Consumes: `SessionFeed`
- Produces: page historique en feed de séances, sans drawers edit/add

- [ ] **Step 1: Remplacer le rendu jour**

Retirer :
- Imports / usage de `HistoryDaySection`, `groupByDayThenExercise`, `AddPerfDrawer`, `entryInsightsFromPerformances` (si plus utilisés), states `editEntry` / `addPerf`, handlers save/update/delete, `resolveTrackedExercise` pour drawers, `getPersonalBest` / `notifyXpGrants` / etc. liés aux drawers.

Garder :
- `HistoryWeekStreak`, empty state, `BackHeader`, chargement `HistoryPageSkeleton`, `ownerUserId`, `entries` (slice `MAX_SHOWN = 150`).

Rendu principal quand `entries.length > 0` et `ownerUserId` :

```tsx
<>
  <HistoryWeekStreak entries={entries} />
  <SessionFeed
    ownerUserId={ownerUserId}
    entries={shown}
    recapVariant="compact"
  />
</>
```

Si `!ownerUserId` mais des entries (edge) : empty message `UI.sessionUnavailable` ou ne rien afficher sous le streak.

`shown = entries.slice(0, MAX_SHOWN)` inchangé.

- [ ] **Step 2: Vérifier manuellement / typecheck**

Run typecheck client. Ouvrir `/#/history` : séances séparées, récap compact, pas de drawer edit.

- [ ] **Step 3: Commit** (si demandé)

```bash
git add client/src/pages/HistoryPage.tsx
git commit -m "$(cat <<'EOF'
feat: render history as session feed like home

EOF
)"
```

---

### Task 6: Brancher `ProfileRecentHistory`

**Files:**
- Modify: `client/src/components/profile/ProfileRecentHistory.tsx`

**Interfaces:**
- Consumes: `SessionFeed`
- Produces: 2 dernières séances + lien Voir tout ; readOnly ami OK

- [ ] **Step 1: Remplacer le contenu card**

Retirer drawers / `HistoryDaySection` / `groupByDayThenExercise` / logique « latest date only ».

Garder la `Card` + titre `UI.profileRecentHistory` + `CardAction` lien `/history` si `!readOnly`.

`sessionOwnerUserId` obligatoire pour le feed ; si absent, return `null` (ou ne pas rendre le feed).

```tsx
if (entries.length === 0) return null;
if (!sessionOwnerUserId) return null;

// ...
<CardContent>
  <SessionFeed
    ownerUserId={sessionOwnerUserId}
    entries={entries}
    limit={2}
    recapVariant="compact"
  />
</CardContent>
```

Props `tracked` / `profile` / `isFriendPresenceTraining` : si plus utilisées après retrait des drawers, les enlever du type **et** mettre à jour les call sites (`ProfileView`) pour ne plus les passer. Si `profile` n’est plus requis pour le drawer save, retirer.

- [ ] **Step 2: Mettre à jour `ProfileView` si la signature change**

Ne passer que ce qui reste utile : `entries`, `readOnly`, `sessionOwnerUserId` (et éventuellement `tracked` si encore besoin ailleurs dans le composant — sinon retirer).

- [ ] **Step 3: Typecheck + vérif profil / ami**

Profil perso : 2 séances max, lien Voir tout. Profil ami : feed read-only (déjà via HomePastSession past mode).

- [ ] **Step 4: Commit** (si demandé)

```bash
git add client/src/components/profile/ProfileRecentHistory.tsx client/src/components/profile/ProfileView.tsx
git commit -m "$(cat <<'EOF'
feat: show last two sessions on profile like home

EOF
)"
```

---

### Task 7: Vérification finale

**Files:**
- None (ou smoke optionnel)

- [ ] **Step 1: Critères de succès (checklist manuelle)**

1. Deux séances le même jour → deux blocs sur `/#/history` et profil.
2. Chaque bloc : titre + durée, récap compact, liste exos.
3. Profil : ≤ 2 séances + Voir tout.
4. Accueil inchangé (teaser taille normale).
5. Plus d’édition perf depuis historique / profil.

- [ ] **Step 2 (optionnel): Smoke e2e**

Si le temps le permet : `client/e2e/smoke/history/session-feed.spec.ts`

- Mock auth + perfs + `**/sessions/*/day/*` renvoyant 2 items le même jour
- `page.goto("/#/history")`
- Assert 2 titres / 2 teasers récap
- `expect(pageErrors).toEqual([])`

Sinon skip ; pas de mise à jour `quality-gates.md` sans smoke.

- [ ] **Step 3: Commit final** (si demandé, inclut le spec si pas encore versionné)

```bash
git add docs/superpowers/specs/2026-10-09-history-profile-session-feed-design.md \
  docs/superpowers/plans/2026-10-09-history-profile-session-feed.md
git commit -m "$(cat <<'EOF'
docs: add history/profile session feed spec and plan

EOF
)"
```

---

## Spec coverage (self-review)

| Exigence spec | Task |
|---|---|
| Feed chronologique par séance | 1, 2, 4, 5, 6 |
| Réutiliser `HomePastSession` | 4 |
| API jour par jour | 2 |
| Récap compact history/profil | 3, 5, 6 |
| Accueil inchangé | 3 (defaults) |
| Profil 2 séances + Voir tout | 6 |
| Read-only | 5, 6 |
| Edge erreurs jour | 2 (catch → items []) |
| Pas de nouvel endpoint | 2 |
| Cleanup HistoryDaySection | hors plan (OK) |
