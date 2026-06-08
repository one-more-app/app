# Mapping exercices → rangs (ligues)

Documentation à jour du système de rangs basé sur `(equipment, target, name)`.

## Source de vérité

| Fichier | Rôle |
|---------|------|
| [`shared/strength-standards.ts`](../shared/strength-standards.ts) | Profils de seuils, résolution exercice → profil, calcul 1RM/rang |
| [`shared/league-aggregate.ts`](../shared/league-aggregate.ts) | Agrégation profil global / par muscle |
| [`api/scripts/check-rank-coverage.mjs`](../api/scripts/check-rank-coverage.mjs) | Audit CI de couverture catalogue |

Les rangs ne sont **pas stockés en base** : ils sont calculés à la demande via le ratio `1RM / poids du corps`.

## Architecture

```
Exercice (equipment, target, name)
  → isIntentionallyExcluded ? → null (pas de rang)
  → normalizeEquipment + getStandardsKey
  → STANDARDS_BY_EQUIPMENT_TARGET (~85 profils)
  → expandLegacyTiersToRankTiers → 16 rangs (bronze_1 … legend)
  → getLeagueInfo
```

## Couverture catalogue (juin 2025)

| Catalogue | Avec rang | Exclusion volontaire | Gap fixable |
|-----------|-----------|----------------------|-------------|
| `popular-exercises.json` (1500) | **1149** | 351 | **0** |
| `popular-exercises.filtered.json` (569) | **536** | 33 | **0** |

Commande d'audit :

```bash
cd api && npm run test:coverage-ranks
```

## Policy d'exclusion (`isIntentionallyExcluded`)

Exclusions **volontaires** (pas de rang, classées `intentional` dans l'audit) :

| Catégorie | Exemples |
|-----------|----------|
| Cardio | `target: cardiovascular system`, machines elliptique/vélo |
| Bodyweight pur abs/spine | crunch, plank, sit-up au sol, leg raise sans charge |
| Mobilité BW | toe touch, flutter kicks, warm-up |
| Équipement non standardisé | band, stability ball, roller, rope, bosu ball |
| Assisted abs | knee raise assisté (mobilité, pas 1RM) |
| BW abductors/adductors | mobilité hanche sans charge mesurable |

**Variantes chargées autorisées** (policy `loaded_only`) :

- Câble / barre / machine / lest : crunch, sit-up, leg raise **avec charge** → profils `cable_abs`, `barbell_abs`, `lever_abs`, `weighted_abs`, etc.

## Normalisation équipement

| Equipment API | Clé normalisée |
|---------------|----------------|
| `smith machine`, `olympic barbell`, `ez barbell`, `trap bar` | `barbell` |
| `kettlebell`, `medicine ball` | `dumbbell` |
| `sled machine`, `tire`, `hammer` | `machine` |
| `weighted` | `weighted` (profils lest dédiés) |
| `assisted` | `assisted` (mappé sur profils BW / machine) |
| `leverage machine` | `leverage machine` |

## Profils de seuils (~85 clés)

Chaque profil définit 10 ratios legacy (M/F) interpolés en **16 rangs**.

### Pectoraux / dos / épaules / jambes (existants)

`barbell_pectorals`, `dumbbell_pectorals`, `cable_pectorals`, `machine_pectorals`, incliné, fly, pullover, row, lats, delts, squat, deadlift, triceps, biceps, mollets, hip thrust, fentes, upright row, face pull, forearms…

### Nouveaux profils (extension couverture)

| Clé | Usage |
|-----|-------|
| `lever_abs` | Crunch machine leverage |
| `weighted_abs` | Crunch / sit-up lesté |
| `kettlebell_abs` | Abdos kettlebell |
| `lever_biceps` | Preacher curl machine |
| `lever_calves` | Calf press machine |
| `barbell_traps` / `dumbbell_traps` / `machine_traps` | Shrugs |
| `lever_spine` / `machine_spine` | Back extension, hyperextension |
| `machine_abductors` / `machine_adductors` | Hip ab/adduction machine |
| `dumbbell_serratus` | Serratus punch |
| `weighted_lats` | Tractions lestées |
| `body weight_quads` / `body weight_glutes` / `body weight_hamstrings` | Force au poids du corps (pistol, nordic, step-up…) |

## Résolution `getStandardsKey`

Ordre de priorité :

1. Exclusion intentionnelle
2. Muscles spéciaux : traps, spine, abductors, adductors, serratus
3. Équipement `weighted` / `assisted`
4. Bodyweight force (lats, dips, pompes, nordic, step-up…)
5. Leg press / tire flip (par nom)
6. Branches par équipement normalisé (barbell, dumbbell, cable, lever, machine)

Fallback : `getEquipmentTargetFromName(name)` pour exercices custom ou metadata incomplète.

## Cas particuliers de charge

| Type | Clés | Ratio |
|------|------|-------|
| Haltères | `DUMBBELL_STANDARDS_KEYS` | Poids **d'un seul** haltère / BW |
| Poids du corps + lest | `BODYWEIGHT_STANDARDS_KEYS` | Lest / BW (1RM total − BW) |
| Mollets BW | `body weight_calves` | Lest / BW uniquement |

## Exclusions hors catalogue

- Exercices **custom** utilisateur (`isCustom: true`) → pas de rang
- Équipement cardio pur (`stationary bike`, `elliptical machine`, etc.) via `CARDIO_EQUIPMENT` dans [`shared/league-aggregate.ts`](../shared/league-aggregate.ts) — **ne pas** y inclure `leverage machine` ni `assisted` (machines à levier / assistées pour la muscu)
- Cible `cardiovascular system` / `cardio` → pas de rang
- Pas de persistance DB du rang par exercice (calcul dynamique)

## Références ratios

- van den Hoek et al. (2024) — powerlifting raw
- ExRx.net, Symmetric Strength, Strength Level

## Tests

- [`api/src/league/league-ranks.spec.ts`](../api/src/league/league-ranks.spec.ts) — smoke profils, exclusions, couverture catalogue, 15 exos populaires
- `npm run test:coverage-ranks` — garde-fou CI (0 gap fixable)
