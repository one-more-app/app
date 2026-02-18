# One More

Application de suivi de progression en musculation — MVP cross-platform (web + mobile via Capacitor).

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'app utilise l'API [ExerciseDB v1](https://www.exercisedb.dev/docs) — **gratuite et sans clé API**.

## Build et déploiement mobile

```bash
# Build web
npm run build

# Ajouter les plateformes (une seule fois)
npm run cap:add:android   # ou cap:add:ios

# Synchroniser après chaque modification
npm run cap:sync

# Ouvrir dans Android Studio / Xcode
npm run cap:open:android
npm run cap:open:ios
```

## Fonctionnalités

- Page d'accueil : liste des exercices suivis avec dernière perf et record
- Ajout d'exercices depuis l'API ExerciseDB (avec images) ou création personnalisée
- Enregistrement des performances (poids + reps)
- Mise à jour ou nouvelle entrée selon le jour (même jour = mise à jour)
- Historique sous forme de graphique par exercice
- Stockage local uniquement, thème sombre
