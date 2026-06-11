# One More

Application de suivi de progression en musculation — **PWA web** et **apps natives** (iOS / Android via Capacitor), avec synchronisation cloud via une API NestJS et PostgreSQL.

## Stack

| Couche | Technos |
|--------|---------|
| **Client** (`client/`) | React 19, Vite 7, Tailwind CSS 4, React Router (HashRouter), SWR, Recharts, Capacitor 8, PWA |
| **API** (`api/`) | NestJS 11, TypeORM, PostgreSQL 16 |
| **Infra locale** | Docker Compose (Postgres sur le port `5433`) |
| **Orchestration** | npm workspaces (racine) + [Task](https://taskfile.dev) (`Taskfile.yml`) |

## Structure du dépôt

```text
.
├── client/          # Front React (web + Capacitor)
├── api/             # API NestJS (auth, profil, exercices suivis, perfs, catalogue)
├── docker-compose.yml
├── Taskfile.yml
└── package.json     # Scripts racine (dev:all, build, cap:*, …)
```

## Prérequis

- Node.js 20+ et npm
- Docker (pour Postgres local)
- [Task](https://taskfile.dev/installation/) (recommandé) ou les scripts npm à la racine
- Pour le mobile : Android Studio / Xcode selon la plateforme

## Configuration

1. Copier les fichiers d’exemple :

   ```bash
   cp client/.env.example client/.env
   cp api/.env.example api/.env
   ```

2. Variables principales :

   | Fichier | Variable | Rôle |
   |---------|----------|------|
   | `client/.env` | `VITE_API_URL` | URL de l’API (ex. `http://localhost:3000`) |
   | `api/.env` | `DATABASE_URL` | Postgres (défaut : `localhost:5433`) |
   | `api/.env` | `JWT_SECRET`, `JWT_EXPIRES_IN` | Sessions JWT |
   | `api/.env` | `GOOGLE_CLIENT_ID_*`, `APPLE_*` | OAuth mobile (optionnel en local) |

   Les builds Capacitor utilisent des fichiers dédiés : `.env.dev.capacitor`, `.env.preprod.capacitor`, `.env.prod.capacitor` (voir `client/.env.example`).

## Démarrage rapide

```bash
# 1. Dépendances (client + api)
task install
# ou : npm install

# 2. Postgres
task docker

# 3. Migrations
task migration:run

# 4. (Optionnel) Catalogue exercices en base
task seed:exercises

# 5. Client + API en parallèle (démarre aussi Docker si besoin)
task dev
```

Équivalent npm à la racine :

```bash
npm install
docker compose up -d
npm run typeorm:migrate -w api
npm run seed:exercises -w api   # optionnel
npm run dev:all                 # Vite (client) + Nest watch (api)
```

- **Client seul** : `task dev:client` ou `npm run dev`
- **API seule** : `task dev:api` ou `npm run dev:api`
- **Preview du build web** : `task build` puis `task preview`

Ports par défaut : client Vite `5173`, API `3000`, Postgres `5433`.

## Fonctionnalités

### Utilisateur

- **Onboarding** : profil (sexe, taille, poids) puis **compte obligatoire** (email/mot de passe ou OAuth Google / Apple sur mobile).
- **Accueil** : exercices suivis, dernière perf, record personnel, saisie rapide poids × reps (même jour = mise à jour).
- **Catalogue** : recherche et filtres (muscle, matériel) via l’API `/exercises` ; exercices personnalisés possibles.
- **Historique** : graphiques par exercice.
- **Stats** : ligues de force par muscle (standards selon profil), carte musculaire, jauge globale.
- **Réglages** : profil, thème **système / clair / sombre**, déconnexion, lien store (mobile).

### Données

- **Cache local** en mémoire + préférences (onboarding, thème) dans `localStorage`.
- **Source de vérité** : API + PostgreSQL une fois connecté (exercices suivis, performances, profil).
- Écritures **optimistes** côté client avec resynchronisation SWR ; erreurs réseau signalées à l’utilisateur.

### Catalogue exercices

- Données issues d’[ExerciseDB v1](https://www.exercisedb.dev/docs) (gratuit, sans clé), consolidées dans `api/data/popular-exercises.json` (~1500 exercices).
- **Import en base** : `task seed:exercises` charge le catalogue pour les listes `/exercises` et `/exercises/meta`.
- **Mise à jour du JSON** (optionnel) : `task exercises:fetch` puis `task seed:exercises`.

## API (`api/`)

Modules principaux :

| Route | Description |
|-------|-------------|
| `POST /auth/*`, `GET /me` | Inscription, connexion, refresh, déconnexion |
| `POST /oauth/:provider/start`, `callback` | Google / Apple (PKCE, mobile Capacitor) |
| `GET/PUT /profile` | Profil utilisateur |
| `GET/POST/PATCH/DELETE /tracked-exercises` | Exercices suivis |
| `GET/POST/PATCH/DELETE /performance-entries` | Performances |
| `GET /exercises`, `GET /exercises/meta` | Catalogue paginé + métadonnées filtres |

Détails OAuth Google / Apple : commentaires dans `api/.env.example`.

### Commandes utiles

```bash
task migration:create      # squelette de migration
task migration:generate    # génération depuis les entities (Postgres requis)
task test:api              # tests unitaires Nest
task lint                  # ESLint client + api
```

## Build web et mobile

### Web / PWA

```bash
task build          # production client
task preview        # prévisualisation
```

### Capacitor

Identifiant app : `com.onemore.app`.

```bash
# Depuis la racine
npm run cap:sync              # build preprod + cap sync (workspace client)

# Depuis client/ — environnements mobile
npm run build:dev             # .env.dev.capacitor + sync
npm run build:preprod
npm run build:prod
npm run cap:open:android
npm run cap:open:ios
```

Sous **WSL** (APK debug sans Android Studio UI) :

```bash
npm run wsl:android:dev       # build preprod + gradle + install adb
```

Génération des icônes / splash : `npm run assets:generate` (client).

## Documentation complémentaire

- [`docs/ANALYSE_MAPPING_LIGUES.md`](docs/ANALYSE_MAPPING_LIGUES.md) — mapping ligues / ExerciseDB
- [`api/README.md`](api/README.md) — boilerplate NestJS (peu spécifique au projet)
