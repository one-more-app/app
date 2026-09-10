# Onboarding record catalog drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sur le catalogue ouvert depuis l’étape record onboarding, ouvrir le drawer de record sur place et enchaîner vers le palier après save, sans revenir à `?step=record`.

**Architecture:** Extraire la persistance du draft record dans `onboarding-exercise-pick.ts`. `ExerciseListPage` en mode `from=onboarding` ouvre `AddPerfDrawer` (copy onboarding) puis navigate vers `?step=rank`. Supprimer le flux mort `setPendingOnboardingExercisePick` → hydrate `fromPick`.

**Tech Stack:** React, React Router, Playwright, Vitest, `AddPerfDrawer`, storage draft onboarding.

## Global Constraints

- Copy UI : aucun `--` ni `—` dans les chaînes affichées.
- Mode onboarding catalogue : draft local uniquement (pas `addTrackedExerciseAndWait` / `savePerformanceAndWait`).
- Tracking : `RECORD_PICK` à l’ouverture du drawer, `RECORD_PERF` au save (comme la liste courte).
- Spec : `docs/superpowers/specs/2026-09-10-onboarding-record-catalog-drawer-design.md`.

---

## File map

| Fichier | Rôle |
|---|---|
| `client/src/lib/onboarding-exercise-pick.ts` | Helper persist draft ; hydrate sans branche pick |
| `client/src/lib/onboarding-exercise-pick.test.ts` | Tests helper + hydrate draft |
| `client/src/lib/storage.ts` | Retirer APIs pending exercise pick |
| `client/src/lib/onboarding-draft-session.test.ts` | Ne plus couvrir le pick |
| `client/src/pages/ExerciseListPage.tsx` | Drawer onboarding + save → rank |
| `client/src/pages/OnboardingPage.tsx` | Utiliser helper persist ; retirer `fromPick` |
| `client/e2e/smoke/onboarding/onboarding-record.spec.ts` | Assertions drawer sur catalogue |

---

### Task 1: Helper `persistOnboardingRecordDraft` + hydrate sans pick

**Files:**
- Modify: `client/src/lib/onboarding-exercise-pick.ts`
- Modify: `client/src/lib/onboarding-exercise-pick.test.ts`
- Modify: `client/src/lib/storage.ts` (pick APIs)
- Modify: `client/src/lib/onboarding-draft-session.test.ts`

**Interfaces:**
- Produces: `persistOnboardingRecordDraft(exercise: OnboardingStarterExercise, weight: number, reps: number): void`
- Produces: `hydrateOnboardingRecordSelection(): { exercise; weight; reps } | null` (plus de `fromPick`)
- Removes: `setPendingOnboardingExercisePick`, `peekPendingOnboardingExercisePick`, `consumePendingOnboardingExercisePick`, type `PendingOnboardingExercisePick` ; garder `clearPendingOnboardingExercisePick()` uniquement dans les discard session pour purger d’anciennes clés localStorage

- [ ] **Step 1: Écrire le test unitaire du helper**

Dans `onboarding-exercise-pick.test.ts`, remplacer le describe `hydrateOnboardingRecordSelection` (branche pick) par :

```ts
import { persistOnboardingRecordDraft, hydrateOnboardingRecordSelection } from "./onboarding-exercise-pick";
import { peekPendingOnboardingRecord } from "./storage";

describe("persistOnboardingRecordDraft", () => {
  // beforeEach/afterEach memoryStorage + beginOnboardingDraftSession comme existant

  it("écrit le draft et hydrate le restaure", () => {
    const exercise = onboardingExerciseFromDraft({
      exerciseId: "catalog-squat",
      name: "Squat",
      originalName: "barbell squat",
      bodyPart: "upper legs",
      target: "quads",
      equipment: "barbell",
      gifUrl: "https://example.com/squat.gif",
    });
    persistOnboardingRecordDraft(exercise, 80, 3);
    const pending = peekPendingOnboardingRecord();
    expect(pending?.exerciseId).toBe("catalog-squat");
    expect(pending?.weight).toBe(80);
    expect(pending?.reps).toBe(3);

    const hydrated = hydrateOnboardingRecordSelection();
    expect(hydrated).toMatchObject({
      exercise: { exerciseId: "catalog-squat", name: "Squat" },
      weight: 80,
      reps: 3,
    });
  });

  it("réutilise clientPerfId si même exerciseId", () => {
    const exercise = onboardingExerciseFromDraft({
      exerciseId: "same",
      name: "A",
      originalName: "a",
      bodyPart: "chest",
      target: "pectorals",
      equipment: "barbell",
    });
    persistOnboardingRecordDraft(exercise, 60, 5);
    const firstId = peekPendingOnboardingRecord()!.clientPerfId;
    persistOnboardingRecordDraft(exercise, 70, 4);
    expect(peekPendingOnboardingRecord()!.clientPerfId).toBe(firstId);
    expect(peekPendingOnboardingRecord()!.weight).toBe(70);
  });
});
```

Retirer l’import et le test qui utilisent `setPendingOnboardingExercisePick` / `fromPick`.

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `cd client && npx vitest run src/lib/onboarding-exercise-pick.test.ts`

Expected: FAIL (`persistOnboardingRecordDraft` undefined ou hydrate encore typé avec `fromPick`)

- [ ] **Step 3: Implémenter le helper et simplifier hydrate**

Dans `onboarding-exercise-pick.ts` :

```ts
export function persistOnboardingRecordDraft(
  exercise: OnboardingStarterExercise,
  weight: number,
  reps: number,
): void {
  const existing = peekPendingOnboardingRecord();
  setPendingOnboardingRecord({
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    originalName: exercise.originalName,
    bodyPart: exercise.bodyPart,
    target: exercise.target,
    equipment: exercise.equipment,
    gifUrl: resolveOnboardingExerciseGifUrl(exercise),
    weight,
    reps,
    clientTrackedId: onboardingTrackedId(exercise.exerciseId),
    clientPerfId:
      existing?.exerciseId === exercise.exerciseId
        ? existing.clientPerfId
        : crypto.randomUUID(),
  });
}

export type OnboardingRecordSelectionHydration = {
  exercise: OnboardingStarterExercise;
  weight: number;
  reps: number;
};

export function hydrateOnboardingRecordSelection(): OnboardingRecordSelectionHydration | null {
  const draft = peekPendingOnboardingRecord();
  if (!draft) return null;
  return {
    exercise: onboardingExerciseFromDraft(draft),
    weight: draft.weight,
    reps: draft.reps,
  };
}
```

Retirer imports `clearPendingOnboardingExercisePick` / `peekPendingOnboardingExercisePick`.

Dans `storage.ts` : supprimer `setPendingOnboardingExercisePick`, `peekPendingOnboardingExercisePick`, `consumePendingOnboardingExercisePick`, le type exporté et le type guard si plus utilisés. **Conserver** `clearPendingOnboardingExercisePick` + appels dans `discardPendingOnboardingDrafts` / clear session pour purger d’anciennes clés.

Dans `onboarding-draft-session.test.ts` : retirer le `setPendingOnboardingExercisePick` du test discard ; garder l’assertion `peekPendingOnboardingRecord` null. Si `peekPendingOnboardingExercisePick` est retiré, ne plus l’asserter (ou asserter via `localStorage.getItem("one-more-pending-onboarding-exercise-pick-v1")` si la clé existe encore dans storage — lire la constante exacte dans `storage.ts`).

- [ ] **Step 4: Relancer les tests**

Run: `cd client && npx vitest run src/lib/onboarding-exercise-pick.test.ts src/lib/onboarding-draft-session.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/onboarding-exercise-pick.ts \
  client/src/lib/onboarding-exercise-pick.test.ts \
  client/src/lib/storage.ts \
  client/src/lib/onboarding-draft-session.test.ts
git commit -m "$(cat <<'EOF'
refactor: persist draft record onboarding sans pick catalogue

EOF
)"
```

---

### Task 2: Drawer sur `ExerciseListPage` + navigation rank

**Files:**
- Modify: `client/src/pages/ExerciseListPage.tsx`
- Modify: `client/src/pages/OnboardingPage.tsx` (helper + retirer `fromPick`)

**Interfaces:**
- Consumes: `persistOnboardingRecordDraft`, `onboardingExerciseFromCatalog`, `defaultOnboardingPerf`, `onboardingTrackedId`, `AddPerfDrawer`
- Produces: UX catalogue → drawer → rank

- [ ] **Step 1: Brancher OnboardingPage sur le helper**

Remplacer le corps de `persistRecordDraft` par un appel à `persistOnboardingRecordDraft`.

Dans le `useEffect` step record, supprimer le bloc :

```ts
if (hydrated.fromPick) {
  setPerfDrawerOpen(true)
  trackOnboardingStepCompleted({ ... RECORD_PICK ... })
}
```

Garder seulement set exercise / weight / reps depuis `hydrated`.

- [ ] **Step 2: Remplacer le pick catalogue par AddPerfDrawer**

Dans `ExerciseListPage.tsx` :

1. Imports : ajouter `AddPerfDrawer`, `defaultOnboardingPerf`, `onboardingTrackedId`, `persistOnboardingRecordDraft`, `peekPendingOnboardingRecord` ; retirer `setPendingOnboardingExercisePick`.
2. State dédié (ne pas réutiliser `addWithPerfExercise` qui déclenche le vrai save API) :

```ts
const [onboardingRecordExercise, setOnboardingRecordExercise] =
  useState<ReturnType<typeof onboardingExerciseFromCatalog> | null>(null)
const [onboardingPerfWeight, setOnboardingPerfWeight] = useState(60)
const [onboardingPerfReps, setOnboardingPerfReps] = useState(5)
const [onboardingPerfDrawerOpen, setOnboardingPerfDrawerOpen] = useState(false)
```

3. Remplacer `pickExerciseForOnboarding` :

```ts
const openOnboardingRecordDrawer = useCallback((exercise: ExerciseDBExercise) => {
  const starter = onboardingExerciseFromCatalog(exercise)
  const draft = peekPendingOnboardingRecord()
  if (draft?.exerciseId === starter.exerciseId) {
    setOnboardingPerfWeight(draft.weight)
    setOnboardingPerfReps(draft.reps)
  } else {
    const defaults = defaultOnboardingPerf(starter)
    setOnboardingPerfWeight(defaults.weight)
    setOnboardingPerfReps(defaults.reps)
  }
  setOnboardingRecordExercise(starter)
  setOnboardingPerfDrawerOpen(true)
  trackOnboardingStepCompleted({
    step: OnboardingSteps.RECORD_PICK,
    exercise_id: starter.exerciseId,
  })
}, [])
```

4. Dans `openAddWithPerf`, si `onboardingRecordPick` → `openOnboardingRecordDrawer(ex)` (pas de guard `canAddExercise`).

5. Handler save :

```ts
const saveOnboardingRecordFromDrawer = (weight: number, reps: number) => {
  if (!onboardingRecordExercise || reps <= 0) return
  persistOnboardingRecordDraft(onboardingRecordExercise, weight, reps)
  trackOnboardingStepCompleted({
    step: OnboardingSteps.RECORD_PERF,
    exercise_id: onboardingRecordExercise.exerciseId,
    weight,
    reps,
  })
  setOnboardingPerfDrawerOpen(false)
  setOnboardingRecordExercise(null)
  navigate('/onboarding?step=rank', { replace: true })
}
```

6. Rendu (à côté ou à la place conditionnelle du drawer générique) :

```tsx
{onboardingRecordExercise ? (
  <AddPerfDrawer
    open={onboardingPerfDrawerOpen}
    onOpenChange={(open) => {
      setOnboardingPerfDrawerOpen(open)
      if (!open) setOnboardingRecordExercise(null)
    }}
    title={UI.onboardingPerfTitle}
    exercise={{
      id: onboardingTrackedId(onboardingRecordExercise.exerciseId),
      name: onboardingRecordExercise.name,
      originalName: onboardingRecordExercise.originalName,
      equipment: onboardingRecordExercise.equipment,
      target: onboardingRecordExercise.target,
    }}
    initialWeight={onboardingPerfWeight}
    initialReps={onboardingPerfReps}
    onSave={saveOnboardingRecordFromDrawer}
  />
) : null}
```

Le drawer générique `addWithPerfExercise` ne doit **pas** s’ouvrir en mode `onboardingRecordPick`.

- [ ] **Step 3: Vérifier typecheck**

Run: `npm run typecheck:gate --prefix client`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ExerciseListPage.tsx client/src/pages/OnboardingPage.tsx
git commit -m "$(cat <<'EOF'
feat: drawer record onboarding sur le catalogue sans retour record

EOF
)"
```

---

### Task 3: E2E smoke onboarding record

**Files:**
- Modify: `client/e2e/smoke/onboarding/onboarding-record.spec.ts`

- [ ] **Step 1: Adapter le spec catalogue**

Remplacer le test `changer d'exo via le catalogue après retour garde le nouvel exo` pour vérifier :

1. Après clic Ajouter sur le catalogue : URL reste `/#/exercises?from=onboarding` ; drawer `UI.onboardingPerfTitle` visible **avant** toute navigation rank/record.
2. Draft localStorage mis à jour après save (ou juste avant navigation — après Enregistrer).
3. Après Enregistrer : heading palier « Ton palier », nom du catalogue, plus de « Développé couché ».

Exemple d’assertions clés :

```ts
await page.getByRole("button", { name: UI.add, exact: true }).click();
await expect(page).toHaveURL(/#\/exercises\?from=onboarding/);
const drawer = page.getByRole("dialog", { name: UI.onboardingPerfTitle });
await expect(drawer).toBeVisible();
await drawer.getByRole("button", { name: "Enregistrer" }).click();
await expect(page).toHaveURL(/#\/onboarding\?step=rank/);
await expect(page.getByRole("heading", { name: "Ton palier" })).toBeVisible();
```

Le test « voir plus d'exercices ouvre le catalogue puis revient au record » (back sans pick) reste inchangé.

- [ ] **Step 2: Lancer le smoke onboarding record**

Run: `cd client && npx playwright test e2e/smoke/onboarding/onboarding-record.spec.ts`

Expected: PASS (3 tests)

- [ ] **Step 3: Commit**

```bash
git add client/e2e/smoke/onboarding/onboarding-record.spec.ts
git commit -m "$(cat <<'EOF'
test: e2e drawer record onboarding reste sur le catalogue

EOF
)"
```

---

## Spec coverage (self-review)

| Exigence spec | Task |
|---|---|
| Drawer sur catalogue sans navigate record | Task 2 |
| Save → rank direct | Task 2 |
| Back catalogue → record | déjà en place, inchangé |
| Tracking RECORD_PICK / RECORD_PERF | Task 2 |
| Draft only (pas API tracked) | Task 2 |
| Nettoyage fromPick / pick storage | Task 1 |
| E2E adapté | Task 3 |
| Liste courte starters inchangée | hors modification (OnboardingPage drawer conservé) |
