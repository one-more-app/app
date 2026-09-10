# Onboarding : sélecteurs poids / taille / âge

Date : 2026-09-10  
Statut : validé en brainstorming, en attente de relecture

## Problème

Sur l’étape gabarit (`body`), les sélecteurs poids et taille (et âge) ne sont pas assez lisibles :

- la règle poids n’affiche pas les valeurs sur les crans majeurs ;
- la roue taille/âge duplique le chiffre en gros au-dessus, alors qu’on veut le hero sur la ligne sélectionnée ;
- le centrage horizontal des deux contrôles doit être net ;
- un retour haptique doit accompagner chaque cran (déjà partiellement en place, à garantir).

Hors scope : genre, reste du funnel, paramètres profil, copy.

## Décisions

- Approche : ajustements ciblés sur `OnboardingRulerPicker` et `OnboardingVerticalWheelPicker` uniquement. Pas de nouveau composant, pas de variante `hero`/`compact`.
- Taille **et** âge partagent le même rendu (même composant).
- Haptique : `hapticSelectionChanged` à chaque cran, plus `primeHaptics` au mount. Pas d’autre style (impact, notification).

## Composants

### `OnboardingRulerPicker` (poids)

| Élément | Comportement |
|---|---|
| Valeur hero | Conservée au-dessus : `font-one-more text-5xl sm:text-6xl` + unité `kg` muted. |
| Crans | Traits mineurs / majeurs inchangés en logique. |
| Labels | Sur chaque cran majeur **tous les 10 kg**, afficher le nombre sous le trait (`tabular-nums`, petite taille, `muted-foreground`). Pas de label sur les autres crans. |
| Centrage | Conteneur `flex flex-col items-center` ; la règle reste `w-full` mais le contenu (hero + track) est centré dans la carte. |
| Haptique | Déjà branché sur changement d’index scroll. **Conserver** et vérifier qu’un cran = un tick (pas de spam au scroll programmatique). |

### `OnboardingVerticalWheelPicker` (taille + âge)

| Élément | Comportement |
|---|---|
| Valeur hero au-dessus | **Supprimée**. |
| Ligne sélectionnée | Même taille que l’ancien hero : `font-one-more text-5xl sm:text-6xl font-bold italic tabular-nums`. |
| Autres lignes | Restent discrètes (`text-base`, muted). |
| Unité | Affichée **à droite** de la valeur sélectionnée dans la zone highlight, en `text-lg text-muted-foreground` (`cm` / `ans`). Pas d’unité sur les lignes non sélectionnées. |
| Hauteur roue | Augmenter légèrement si besoin pour que le gros chiffre ne soit pas coupé (`h-56` → ajuster). |
| Centrage | Wrapper centré (`items-center`, `mx-auto` / `max-w-xs` comme aujourd’hui). |
| Haptique | `WheelPicker` avec `haptic` actif (défaut `true`). Garder `primeHaptics` au mount. Ne pas passer `haptic={false}`. |

## Centrage commun

Les deux pickers doivent apparaître centrés horizontalement dans `StepCard`. Si le décalage vient du parent (padding asymétrique, alignement stretch), corriger au niveau du picker (`w-full` + `items-center`) plutôt que de refondre `StepCard`.

## Haptique (exigence explicite)

| Composant | Attendu |
|---|---|
| Règle poids | `hapticSelectionChanged` quand l’index du cran sous le curseur change. |
| Roue taille / âge | `hapticSelectionChanged` via `WheelPicker` à chaque `onValueChange` distinct. |

Sur web : no-op (comportement actuel de `@/lib/haptics`). Sur natif Capacitor : tick à chaque cran.

## Fichiers touchés

- `client/src/components/onboarding/OnboardingRulerPicker.tsx`
- `client/src/components/onboarding/OnboardingVerticalWheelPicker.tsx`
- Éventuellement styles `classNames` du wheel si la hauteur highlight doit suivre le `text-5xl`

Pas de changement API dans `OnboardingPage.tsx` sauf si un `className` de centrage est nécessaire.

## Tests

- Smoke body profile existant : ne doit pas casser (sélecteurs toujours interactifs, valeurs dans les bornes).
- Pas de nouveau test e2e obligatoire pour le rendu typographique / haptique (haptique non observable en Playwright web).

## Critères de done

1. Labels numériques tous les 10 kg sur la règle poids.
2. Plus de chiffre dupliqué au-dessus pour taille et âge ; sélection en `text-5xl` / `sm:text-6xl`.
3. Les deux contrôles visuellement centrés dans la carte.
4. Haptique à chaque cran sur les deux composants (natif).
5. Copywriting : aucun `--` / `—` dans les chaînes affichées.
