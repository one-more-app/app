# Prompts à coller dans Cursor

Mets le dossier dans le repo sous `docs/redesign-accueil/` avant de commencer.

## 1. Premier message (cadrage, mode Ask ou Plan)

```
Lis @docs/redesign-accueil/HANDOFF.md en entier, puis regarde les captures dans @docs/redesign-accueil/screens et la source @docs/redesign-accueil/prototype-source.html.

Ne code rien pour l'instant. Pour le lot 1 du HANDOFF :
1. liste les fichiers de client/src que tu vas modifier ou créer,
2. liste les composants existants que tu réutilises,
3. liste les données nécessaires et d'où elles viennent (hooks, API), et ce qui manque côté API,
4. signale tout écart entre le prototype et le code actuel qui demande une décision.

Respecte les règles de .cursor/rules. Le prototype est une référence visuelle, ne copie pas son HTML.
```

## 2. Implémentation d'un lot (mode Agent)

```
Implémente le lot N du @docs/redesign-accueil/HANDOFF.md selon le plan validé.
Référence visuelle : captures @docs/redesign-accueil/screens/XX-*.png.
Contraintes :
- réutilise les composants existants (RankBadge, StreakFlameCount, ExerciseImage, AddPerfDrawer, RestTargetQuickEdit, EmptyState, SessionCommentsThread...),
- textes en français exactement comme dans le prototype,
- respecte .cursor/rules (rest-timer, typography, copywriting-french, accent-contrast, mobile-safe-area, openpanel-tracking),
- données réelles via les hooks existants, pas de données en dur.
À la fin : lance le lint et les tests, puis liste ce qui reste à faire ou à vérifier sur mobile.
```

## 3. Vérification

```
Compare ce que tu as implémenté avec @docs/redesign-accueil/screens/XX-*.png et le HANDOFF.
Liste chaque différence visuelle ou de comportement, puis corrige celles qui ne sont pas voulues.
```
