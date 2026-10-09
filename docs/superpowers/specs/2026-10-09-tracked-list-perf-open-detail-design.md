# Naviguer vers la fiche après perf depuis la liste suivis

## Problème

Sur la page Exercices, la section des exercices **déjà suivis** affiche des `ExerciseCard` avec un bouton `+`. Après enregistrement d’une perf via ce drawer, l’utilisateur reste sur la liste. Il doit retaper la carte pour ouvrir la fiche.

## Objectif

Après une sauvegarde réussie d’une perf depuis cette liste, ouvrir automatiquement la fiche de l’exercice concerné (`/exercise/{trackedId}`).

## Hors scope

- Barre de séance live (`SessionLiveBar`)
- Liste séance home (`HomeLiveSession`)
- Édition d’une perf existante
- Annulation / fermeture du drawer sans save
- Parcours catalogue (ajout + première perf) : déjà navigue vers la fiche

## Comportement

| Action | Résultat |
|--------|----------|
| Save réussi depuis `+` d’un exo suivi | Fermeture drawer (comportement actuel) puis `navigate(`/exercise/${trackedId}`)` |
| Cancel drawer | Reste sur la liste |
| Tap carte (hors `+`) | Inchangé : ouvre déjà la fiche |

`trackedId` = `api-${ex.id}` (même convention que `onOpenTrackedExercise` et `saveTrackedPerf` aujourd’hui).

Navigation **sans** `replace` : le retour système / back ramène à la liste Exercices.

Ordre après save : garder les notifs XP / milestones existantes, puis naviguer (même esprit que le parcours catalogue, sans la complexité celebration/hold de first-exercise).

## Implémentation

Point unique : `saveTrackedPerf` dans [`client/src/pages/ExerciseListPage.tsx`](../../../client/src/pages/ExerciseListPage.tsx).

Après succès de `savePerformanceAndWait` (+ `notifyXpGrants` / `notifyPerfMilestones` / `refreshAfterPerfChange` comme aujourd’hui), appeler `navigate(`/exercise/${trackedId}`)`.

Aucun changement requis dans `ExerciseCard` ni `ExerciseCatalogBrowse` si le parent gère la nav dans le callback.

## Tests

Smoke e2e si un parcours couvre déjà « perf depuis liste suivis » : étendre pour assert la navigation vers la fiche. Sinon, vérification manuelle suffisante pour ce micro-changement ; ajouter un smoke court si le temps le permet (mocks via `mockExerciseWorkflowApi`).

## Critères de succès

1. Depuis la liste suivis, `+` → enregistrer une série → lander sur la fiche de cet exo.
2. Cancel drawer → toujours sur la liste.
3. Barre live / home inchangés.
