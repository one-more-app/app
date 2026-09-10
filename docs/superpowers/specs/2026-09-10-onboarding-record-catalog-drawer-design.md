# Onboarding record : drawer perf sur le catalogue

Date : 2026-09-10  
Statut : validé

## Problème

Depuis l’étape record (`/onboarding?step=record`), « Voir plus d’exercices » ouvre le catalogue (`/exercises?from=onboarding`). Au choix d’un exercice, l’app **renvoie** vers l’étape record puis ouvre le drawer. Ce va-et-vient est confus : l’utilisateur croit avoir quitté le catalogue pour rien.

## Décision

Approche **A** : ouvrir le drawer de saisie de record **sur le catalogue**, sans navigation. À l’enregistrement, enchaîner **directement** sur l’étape palier (`/onboarding?step=rank`).

## Flux cible

```text
record (liste courte)
  → Voir plus d'exercices → /exercises?from=onboarding
  → clic exo → AddPerfDrawer sur place (titre onboarding)
  → Enregistrer → draft + tracking → /onboarding?step=rank

retour header catalogue (sans save) → /onboarding?step=record
```

La sélection depuis la liste courte (starters) reste inchangée : drawer sur la page record, puis rank.

## Comportement détaillé

### Catalogue (`ExerciseListPage`, `from=onboarding`)

1. Clic sur un exo (bouton Ajouter / carte) : **ne plus** appeler `pickExerciseForOnboarding` (persist pick + navigate record).
2. Ouvrir `AddPerfDrawer` sur place avec :
   - titre `UI.onboardingPerfTitle` (« Rentre ton record ») ;
   - poids / reps initiaux via `defaultOnboardingPerf` (ou draft existant si même `exerciseId`) ;
   - mapping exo catalogue → `OnboardingStarterExercise` via `onboardingExerciseFromCatalog`.
3. Fermeture drawer sans save : rester sur le catalogue, aucun draft forcé, pas de navigation.
4. Tracking aligné sur la liste courte :
   - à l’**ouverture** du drawer : `RECORD_PICK` ;
   - au **save** : persist draft + `RECORD_PERF` + `navigate('/onboarding?step=rank', { replace: true })`.
5. Ne pas passer par le drawer générique « Ajouter et enregistrer une perf » ni `addTrackedExerciseAndWait` / `savePerformanceAndWait` dans ce mode (le record onboarding reste un **draft** jusqu’à l’auth / commit).

### Retour arrière

- Header catalogue : inchangé → `/onboarding?step=record`.
- Pas de changement sur le back de l’étape record.

### Hydratation `fromPick`

Le chemin « pick → navigate record → `hydrateOnboardingRecordSelection` avec `fromPick: true` → auto-open drawer » n’est plus le flux principal.

- Nettoyer ou laisser inerte : retirer l’usage de `setPendingOnboardingExercisePick` + navigate depuis le catalogue.
- Si plus aucun producteur de pick, simplifier `hydrateOnboardingRecordSelection` (plus de branche pick / `fromPick`) et les tests unitaires associés. Sinon garder la branche pour compatibilité sessions en cours (YAGNI : préférer supprimer si dead).

## Fichiers touchés (prévus)

| Fichier | Changement |
|---------|------------|
| `client/src/pages/ExerciseListPage.tsx` | Drawer onboarding inline ; save → rank |
| `client/src/lib/onboarding-exercise-pick.ts` | Retirer / simplifier pick + hydrate `fromPick` si dead |
| `client/src/pages/OnboardingPage.tsx` | Retirer auto-open drawer via `fromPick` si dead |
| `client/src/lib/storage.ts` | Optionnel : retirer APIs pending exercise pick si plus utilisées |
| `client/e2e/smoke/onboarding/onboarding-record.spec.ts` | Adapter assertions URL + drawer + rank |

Helper possible (optionnel, si duplication gênante) : petite fonction partagée « persist draft + track + go rank » dans `onboarding-exercise-pick.ts` ou `onboarding-record.ts`, appelée depuis catalogue et éventuellement depuis `OnboardingPage`.

## Tests

### E2E (`onboarding-record.spec.ts`)

- Spec « voir plus d'exercices » (back sans pick) : inchangé.
- Spec « changer d'exo via le catalogue » :
  - après clic Ajouter : drawer visible **sur** `/#/exercises?from=onboarding` (pas de retour record avant save) ;
  - après Enregistrer : URL `/#/onboarding?step=rank`, palier avec le nouvel exo ;
  - draft localStorage à jour (exerciseId catalogue).

### Unitaires

- Mettre à jour / supprimer les tests `hydrateOnboardingRecordSelection` liés à `fromPick` selon le nettoyage choisi.
- Couvrir le helper de persist+rank s’il est extrait.

## Hors scope

- Changer le parcours liste courte (starters) sur la page record.
- Overlay catalogue embarqué dans `OnboardingPage` (approche B).
- Custom exercise depuis le catalogue en mode onboarding record pick.
- Copy / analytics hors les events déjà présents sur record pick / perf.
