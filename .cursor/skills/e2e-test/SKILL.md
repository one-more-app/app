---
name: e2e-test
description: Crée et exécute des tests e2e Playwright smoke pour One More à partir d'une description de parcours utilisateur. Explore le code UI/API, réutilise les mocks helpers/workflow-api, vérifie les sélecteurs FR, lance npm run test:smoke. Utiliser quand l'utilisateur demande un test e2e, un smoke test, ou un parcours Playwright.
---

# Créer un test e2e smoke (One More)

## Déclencheurs

- « ajoute un test e2e pour … »
- « smoke test … »
- « teste le parcours … avec Playwright »
- « lance les tests e2e »

## Workflow obligatoire

```
- [ ] 1. Comprendre le parcours demandé (état initial, actions, résultat visible)
- [ ] 2. Explorer le code (page React, hooks, data-api.ts, translations.ts)
- [ ] 3. Choisir les helpers/mocks existants
- [ ] 4. Écrire le spec dans client/e2e/smoke/
- [ ] 5. Exécuter npm run test:smoke --prefix client
- [ ] 6. Corriger jusqu'à 5/5 verts (ou N+1 si nouveau spec)
- [ ] 7. Mettre à jour docs/quality-gates.md si nouveau parcours smoke
```

**Si l'utilisateur demande d'exécuter le test** : lancer la commande à l'étape 5, ne pas s'arrêter à l'écriture du fichier.

## Étape 2 : exploration code

| Besoin | Où chercher |
|--------|-------------|
| Route HashRouter | `client/src/App.tsx` ou routes |
| Texte bouton/label | `client/src/lib/translations.ts` (`UI.*`) |
| Endpoints API | `client/src/lib/data-api.ts`, `client/src/lib/social-api.ts` |
| Flux métier (ajout perf, etc.) | page `client/src/pages/*.tsx` |
| Specs existantes | `client/e2e/smoke/*.spec.ts` |

Lire au moins un spec proche (`add-exercise.spec.ts`, `log-performance.spec.ts`) avant d'écrire.

## Étape 3 : choix mocks

| Parcours | Setup |
|----------|-------|
| Page publique / auth seule | `seedOnboardingDone` + éventuellement `mockAuthApi` |
| Utilisateur connecté, lecture seule | `seedAuthenticatedSession` + `mockAuthenticatedApi` |
| Catalogue, ajout exercice, perf | `seedAuthenticatedSession` + `mockExerciseWorkflowApi` |
| Exercice déjà suivi | `mockExerciseWorkflowApi(page, { seedTrackedExercise: true })` |

Toujours : `trackPageErrors(page)` + `expect(pageErrors).toEqual([])` en fin de test.

`mockCoreAuthenticatedApi` (appelé en interne) pose déjà `seedE2eApiOrigin`. Ne pas pointer l'API vers `localhost:3000`.

## Étape 4 : écrire le spec

Template minimal :

```typescript
import { expect, test } from "@playwright/test";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { mockExerciseWorkflowApi } from "./workflow-api";

test("description courte en français", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page);

  await page.goto("/#/ma-route");

  // Préférer getByRole, getByLabel, getByPlaceholder
  // exact: true si plusieurs boutons partagent un libellé

  expect(pageErrors).toEqual([]);
});
```

### Règles sélecteurs

- Copy depuis `UI.*`, pas de texte anglais hardcodé sauf noms d'exercices fixture
- `getByRole('button', { name: 'Continuer', exact: true })` sur auth
- Scoper les clics dans un `dialog` quand un drawer est ouvert
- Attendre une réponse réseau si l'UI dépend d'un POST :

```typescript
const post = page.waitForResponse(
  (r) => r.url().includes("/performance-entries") && r.request().method() === "POST",
);
await dialog.getByRole("button", { name: "Enregistrer" }).click();
await post;
```

### Nouveau endpoint API

1. Ajouter le handler dans `workflow-api.ts` (stateful) ou `helpers.ts` (statique)
2. GET simple → `route.fulfill({ status: 200, body: JSON.stringify(...) })`
3. POST → parser `postDataJSON()`, mettre à jour l'état en mémoire, renvoyer le shape attendu par `data-api.ts`
4. Pour les réponses perf avec XP : utiliser `buildXpGrantResult()` ou équivalent (`grants` array obligatoire)

### Fixtures

Données stables : `client/e2e/fixtures/exercises.ts` (`e2eCatalogExercise`, `e2eTrackedId`).

## Étape 5 : exécution

```bash
# Tous les smoke
npm run test:smoke --prefix client

# Un seul fichier
cd client && npx playwright test e2e/smoke/mon-parcours.spec.ts

# Preview stale après modif app
lsof -ti:4173 | xargs kill -9
```

Interpréter les échecs :

| Symptôme | Cause probable |
|----------|----------------|
| Drawer reste ouvert après Enregistrer | POST non intercepté ou `xp.grants` absent |
| Timeout URL | navigation bloquée par erreur JS (voir pageErrors) |
| strict mode violation | plusieurs éléments, affiner le locator |
| `pageErrors` non vide | bug app réel ou mock incomplet |

Lire `client/test-results/**/error-context.md` pour le snapshot accessibilité.

## Étape 7 : documentation

Ajouter une ligne dans `docs/quality-gates.md` (section pre-push) pour chaque nouveau parcours smoke.

## Références

- Rule globale : `.cursor/rules/e2e-tests.mdc`
- Copy FR : `.cursor/rules/copywriting-french.mdc`
- Quality gates : `docs/quality-gates.md`
