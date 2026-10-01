# Browse Count Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dans le parcours zone → muscle → matériel, trier chaque liste par nombre d’exercices décroissant (départage alphabétique FR).

**Architecture:** Modifier uniquement les helpers `countByZone`, `countByTarget` et `countByEquipment` dans `exercise-catalog-browse.ts`. `ExerciseBrowseNavigator` consomme déjà ces listes — aucun changement UI. Couvrir le comportement par des tests Vitest.

**Tech Stack:** TypeScript, Vitest (`cd client && npx vitest run …`).

## Global Constraints

- Spec : `docs/superpowers/specs/2026-10-01-browse-count-sort-design.md`
- Tri : `count` décroissant, puis `localeCompare(..., "fr", { sensitivity: "base" })`
- `__unspecified__` toujours en dernier dans `countByEquipment` (même si count élevé)
- Hors scope : filtres chips muscle/matériel, tri de la liste d’exercices, toggle A–Z
- Ne pas committer sauf demande explicite de l’utilisateur (ignorer les steps Commit tant que non demandé)

## File Structure

| File | Responsibility |
|---|---|
| `client/src/lib/exercise-catalog-browse.ts` | Tri par count des 3 helpers de parcours |
| `client/src/lib/exercise-catalog-browse.test.ts` | Tests unitaires du tri |

---

### Task 1: Tri par count (zone / muscle / matériel)

**Files:**
- Create: `client/src/lib/exercise-catalog-browse.test.ts`
- Modify: `client/src/lib/exercise-catalog-browse.ts` (helpers `countByZone`, `countByTarget`, `countByEquipment` ; retirer l’import mort `orderedMuscleGroups` si inutilisé)

**Interfaces:**
- Consumes: `BrowseableExercise`, `UNSPECIFIED_EQUIPMENT`, `exerciseZone` (inchangés)
- Produces (signatures inchangées) :
  - `countByZone(exercises: BrowseableExercise[]): { zone: string; count: number }[]`
  - `countByTarget(exercises: BrowseableExercise[], zone: string): { target: string; count: number }[]`
  - `countByEquipment(exercises: BrowseableExercise[], zone: string, target: string): { equipment: string; count: number }[]`

- [ ] **Step 1: Write the failing test**

Créer `client/src/lib/exercise-catalog-browse.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
  UNSPECIFIED_EQUIPMENT,
  countByEquipment,
  countByTarget,
  countByZone,
  type BrowseableExercise,
} from "./exercise-catalog-browse";

function ex(
  partial: Pick<BrowseableExercise, "id" | "name"> &
    Partial<Omit<BrowseableExercise, "id" | "name">>,
): BrowseableExercise {
  return { ...partial };
}

describe("countByZone", () => {
  it("trie par count décroissant (plus d’anatomique imposé)", () => {
    // Anatomique : chest avant back. Ici back a plus d’exos → back d’abord.
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "chest", target: "pectorals" }),
      ex({ id: "2", name: "b", bodyPart: "back", target: "lats" }),
      ex({ id: "3", name: "c", bodyPart: "back", target: "lats" }),
      ex({ id: "4", name: "d", bodyPart: "back", target: "lats" }),
    ];
    expect(countByZone(pool).map((e) => e.zone)).toEqual(["back", "chest"]);
    expect(countByZone(pool).map((e) => e.count)).toEqual([3, 1]);
  });

  it("à égalité de count, départage alphabétique fr", () => {
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "shoulders", target: "delts" }),
      ex({ id: "2", name: "b", bodyPart: "chest", target: "pectorals" }),
    ];
    expect(countByZone(pool).map((e) => e.zone)).toEqual(["chest", "shoulders"]);
  });
});

describe("countByTarget", () => {
  it("trie par count décroissant puis alphabétique", () => {
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "upper arms", target: "biceps" }),
      ex({ id: "2", name: "b", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "3", name: "c", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "4", name: "d", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "5", name: "e", bodyPart: "chest", target: "pectorals" }),
    ];
    const entries = countByTarget(pool, "upper arms");
    expect(entries.map((e) => e.target)).toEqual(["triceps", "biceps"]);
    expect(entries.map((e) => e.count)).toEqual([3, 1]);
  });

  it("à égalité de count, départage alphabétique", () => {
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "2", name: "b", bodyPart: "upper arms", target: "biceps" }),
    ];
    expect(countByTarget(pool, "upper arms").map((e) => e.target)).toEqual([
      "biceps",
      "triceps",
    ]);
  });
});

describe("countByEquipment", () => {
  it("trie par count décroissant puis alphabétique", () => {
    const pool: BrowseableExercise[] = [
      ex({
        id: "1",
        name: "a",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "dumbbell",
      }),
      ex({
        id: "2",
        name: "b",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
      }),
      ex({
        id: "3",
        name: "c",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
      }),
      ex({
        id: "4",
        name: "d",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
      }),
    ];
    const entries = countByEquipment(pool, "chest", "pectorals");
    expect(entries.map((e) => e.equipment)).toEqual(["barbell", "dumbbell"]);
    expect(entries.map((e) => e.count)).toEqual([3, 1]);
  });

  it("place __unspecified__ en dernier même si count élevé", () => {
    const pool: BrowseableExercise[] = [
      ex({
        id: "1",
        name: "a",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "cable",
      }),
      ex({ id: "2", name: "b", bodyPart: "chest", target: "pectorals" }),
      ex({ id: "3", name: "c", bodyPart: "chest", target: "pectorals" }),
      ex({ id: "4", name: "d", bodyPart: "chest", target: "pectorals" }),
    ];
    const entries = countByEquipment(pool, "chest", "pectorals");
    expect(entries.map((e) => e.equipment)).toEqual([
      "cable",
      UNSPECIFIED_EQUIPMENT,
    ]);
    expect(entries.map((e) => e.count)).toEqual([1, 3]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/lib/exercise-catalog-browse.test.ts`

Expected: FAIL — au moins `countByZone` / `countByTarget` / `countByEquipment` ne respectent pas l’ordre par count (ex. zone encore anatomique → `["chest", "back"]` au lieu de `["back", "chest"]`).

- [ ] **Step 3: Write minimal implementation**

Dans `client/src/lib/exercise-catalog-browse.ts` :

1. Retirer `orderedMuscleGroups` de l’import `muscle-filter` s’il n’est plus utilisé.

2. Remplacer le corps de tri de chaque helper :

```ts
export function countByZone(
  exercises: BrowseableExercise[],
): { zone: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    const z = exerciseZone(ex);
    if (!z) continue;
    counts.set(z, (counts.get(z) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a, ca], [b, cb]) => {
      if (cb !== ca) return cb - ca;
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    })
    .map(([zone, count]) => ({ zone, count }));
}

export function countByTarget(
  exercises: BrowseableExercise[],
  zone: string,
): { target: string; count: number }[] {
  const z = zone.toLowerCase();
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    if (exerciseZone(ex) !== z) continue;
    const t = (ex.target ?? "").toLowerCase();
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a, ca], [b, cb]) => {
      if (cb !== ca) return cb - ca;
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    })
    .map(([target, count]) => ({ target, count }));
}

export function countByEquipment(
  exercises: BrowseableExercise[],
  zone: string,
  target: string,
): { equipment: string; count: number }[] {
  const z = zone.toLowerCase();
  const t = target.toLowerCase();
  const counts = new Map<string, number>();
  let unspecified = 0;
  for (const ex of exercises) {
    if (exerciseZone(ex) !== z) continue;
    if ((ex.target ?? "").toLowerCase() !== t) continue;
    const eq = ex.equipment?.trim().toLowerCase();
    if (!eq) {
      unspecified += 1;
      continue;
    }
    counts.set(eq, (counts.get(eq) ?? 0) + 1);
  }
  if (unspecified > 0) {
    counts.set(UNSPECIFIED_EQUIPMENT, unspecified);
  }
  return [...counts.entries()]
    .sort(([a, ca], [b, cb]) => {
      if (a === UNSPECIFIED_EQUIPMENT) return 1;
      if (b === UNSPECIFIED_EQUIPMENT) return -1;
      if (cb !== ca) return cb - ca;
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    })
    .map(([equipment, count]) => ({ equipment, count }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/lib/exercise-catalog-browse.test.ts`

Expected: PASS (tous les tests du fichier).

- [ ] **Step 5: Smoke manuel rapide (optionnel)**

Ouvrir le parcours catalogue (`/exercises`) : à l’étape zone, puis muscle, puis matériel, vérifier que les tuiles avec le plus gros compteur sont en haut (matériel non précisé en bas).

- [ ] **Step 6: Commit** (seulement si l’utilisateur le demande)

```bash
git add client/src/lib/exercise-catalog-browse.ts client/src/lib/exercise-catalog-browse.test.ts
git commit -m "$(cat <<'EOF'
feat(client): tri parcours exercices par nombre d'exos

EOF
)"
```

---

## Spec coverage (self-review)

| Exigence spec | Task |
|---|---|
| Zones triées par count ↓ | Task 1 |
| Muscles triés par count ↓ | Task 1 |
| Matériel trié par count ↓ | Task 1 |
| Départage alphabétique | Task 1 |
| `__unspecified__` en dernier | Task 1 |
| Hors scope chips / liste exos | Non touché |
| Tests unitaires | Task 1 |
| Retirer import `orderedMuscleGroups` mort | Task 1 Step 3 |
