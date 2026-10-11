# Prompts Cursor · flow post-inscription

Dézippe ce dossier dans le repo sous `docs/flow-inscription/`.

## 1. Cadrage (mode Ask ou Plan)

```
Lis @docs/flow-inscription/FLOW_INSCRIPTION.md en entier et regarde les captures @docs/flow-inscription/maquettes/clair dans l'ordre (A, B, C, D).
Puis lis le code actuel de l'onboarding : @client/src/pages/OnboardingPage.tsx, @client/src/components/onboarding, @client/src/components/TimePicker.tsx, @client/src/lib/reminder-schedule.ts.

Ne code rien. Donne-moi :
1. l'enchaînement actuel des étapes après l'inscription, et ce qui change avec le nouveau flow ;
2. pour chaque écran A1 à D1 : le composant existant réutilisé ou le composant à créer ;
3. les données et appels API nécessaires (rappel salle, ReminderSlot par jour) et ce qui manque côté API ;
4. les événements OpenPanel à ajouter ;
5. les points qui demandent une décision.
Respecte .cursor/rules. Le prototype est une référence visuelle, ne copie pas son HTML.
```

## 2. Implémentation d'un lot (mode Agent)

```
Implémente le lot N de @docs/flow-inscription/FLOW_INSCRIPTION.md (section "Consignes pour Cursor", point 9), selon le plan validé.
Référence : captures @docs/flow-inscription/maquettes/clair/<écrans du lot>.png et @docs/flow-inscription/maquettes/sombre/<écrans du lot>.png.
Contraintes :
- réutilise les composants existants (TimePicker, GymSearchPicker, OnboardingGymPermissionsStep, AddPerfDrawer, EmptyState),
- textes exacts du document, en français,
- tokens de thème uniquement, pas de couleur en dur,
- respecte .cursor/rules (copywriting-french, typography, accent-contrast, mobile-safe-area, openpanel-tracking).
À la fin : lint, tests, puis la liste de ce qu'il faut vérifier sur téléphone.
```

## 3. Vérification

```
Compare l'implémentation avec les captures du lot (clair et sombre) et avec les textes de @docs/flow-inscription/FLOW_INSCRIPTION.md.
Liste chaque écart (texte, espacement, couleur, comportement) et corrige ceux qui ne sont pas voulus.
```
