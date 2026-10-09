# Tracked list perf → open detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Après une perf enregistrée depuis le `+` d’un exercice suivi sur la page Exercices, ouvrir la fiche de cet exercice.

**Architecture:** Un seul changement dans `saveTrackedPerf` (`ExerciseListPage`) : `navigate` après save réussi. Smoke e2e pour verrouiller le parcours.

**Tech Stack:** React, react-router-dom, Playwright smoke.

## Global Constraints

- Copy UI : pas de `--` / `—` dans les chaînes affichées ou assertions.
- Pas de nav depuis `SessionLiveBar` / home live.
- Navigation sans `replace`.

---

### Task 1: Naviguer après `saveTrackedPerf`

**Files:**
- Modify: `client/src/pages/ExerciseListPage.tsx` (`saveTrackedPerf`)
- Test: `client/e2e/smoke/exercises/tracked-list-log-perf.spec.ts`
- Docs: `docs/quality-gates.md`

- [x] **Step 1: Implémenter la navigation**

Dans `saveTrackedPerf`, après succès (`notifyXpGrants` / `notifyPerfMilestones`), appeler `navigate(\`/exercise/${trackedId}\`)`. Ajouter `navigate` aux deps du `useCallback`. Garder `refreshAfterPerfChange` dans le `finally`.

- [x] **Step 2: Smoke e2e**

Créer le spec : session auth + `mockExerciseWorkflowApi({ seedTrackedExercise: true })` → `/#/exercises` → `+` (`Nouvelle performance`) dans « Tes exercices » → Enregistrer → URL `#/exercise/{e2eTrackedId}` + `pageErrors` vide.

- [x] **Step 3: Lancer le smoke**

`npx playwright test e2e/smoke/exercises/tracked-list-log-perf.spec.ts --prefix client` (ou via `npm run test:smoke --prefix client` filtré). Vert attendu.

- [x] **Step 4: quality-gates**

Ajouter la ligne du parcours dans `docs/quality-gates.md`.
