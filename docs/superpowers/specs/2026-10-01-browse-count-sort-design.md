# Parcours exercices : tri par nombre d’exercices

Date : 2026-10-01  
Statut : validé (design)

## Problème

Dans le parcours de recherche / parcours imbriqué (zone → muscle → matériel), les listes de **zones**, **muscles** et **matériels** ne sont pas ordonnées par richesse du catalogue. Les zones suivent un ordre anatomique fixe ; muscles et matériels sont triés alphabétiquement. Le compteur d’exercices est déjà affiché mais n’influence pas l’ordre, donc les options les plus utiles ne remontent pas en premier.

## Décision

Approche **1** : trier les trois listes par **nombre d’exercices décroissant**, avec départage alphabétique. Pas d’option utilisateur, pas de changement hors parcours.

## Comportement cible

Pour chaque étape du parcours (`ExerciseBrowseNavigator`) :

1. Trier par `count` **décroissant**.
2. À égalité de count : ordre **alphabétique** (locale `fr`, sensibilité de base).
3. Pour le matériel : la clé `__unspecified__` (« matériel non précisé ») reste **toujours en bas**, quel que soit son count.

Les badges / libellés de count restent inchangés. Seul l’ordre des tuiles change.

### Hors scope

- Filtres chips muscle / matériel (`MuscleFilterControl`, `EquipmentFilterControl`) : ordre actuel conservé.
- Tri de la **liste d’exercices** (popularité, dernière perf) : inchangé.
- Pas de toggle « A–Z / par count ».

## Technique

Un seul point d’implémentation : `client/src/lib/exercise-catalog-browse.ts`.

| Helper | Aujourd’hui | Cible |
|--------|-------------|--------|
| `countByZone` | Ordre anatomique via `orderedMuscleGroups` | `count` ↓ puis nom |
| `countByTarget` | Alphabétique seul | `count` ↓ puis nom |
| `countByEquipment` | Alphabétique ; unspecified en dernier | `count` ↓ puis nom ; unspecified toujours en dernier |

`ExerciseBrowseNavigator` consomme déjà ces helpers : aucun changement UI attendu. Catalogue et exercices suivis partagent le même code.

Après modification, `orderedMuscleGroups` peut ne plus être utilisé dans ce fichier ; retirer l’import s’il devient mort (ne pas toucher `muscle-filter.ts` tant qu’il sert ailleurs).

## Tests

Ajouter des tests unitaires sur les trois helpers (fichier dédié type `exercise-catalog-browse.test.ts`) :

- Plus grand count en premier.
- Égalité de count → ordre alphabétique.
- Equipment unspecified toujours en dernier même si count élevé.
- Zones : plus d’ordre anatomique imposé.

Pas de test E2E.

## Critères de succès

- Sur zone / muscle / matériel, l’option avec le plus d’exercices apparaît en haut (sauf unspecified en bas pour le matériel).
- Aucune régression visuelle hors ordre des tuiles.
- Tests unitaires verts.
