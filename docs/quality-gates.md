# Quality gates

Deux filets automatiques pour limiter les régressions sans multiplier les tests unitaires.

## À chaque commit (`pre-commit`)

- TypeScript sur le chemin auth critique (`typecheck:gate`)
- Build API Nest (compile TypeScript serveur)
- ESLint auto-fix sur les fichiers **stagés** client + API (`lint-staged`)
- Smoke Playwright sur les parcours critiques :
  - chargement de `/auth`
  - inscription complète (API mockée)
  - déconnexion (session effacée)
  - ajout d'un exercice depuis le catalogue (perf incluse)
  - enregistrement d'une performance sur la fiche exercice
  - onboarding intro (slider features → Commencer → genre)
  - onboarding body + intent + record → palier → compte
  - onboarding record : changement d'exo via « Voir plus » après retour garde le nouvel exo
  - onboarding body (genre, profil) inclus dans `POST /auth/register`
  - onboarding skip (âge → compte → catalogue exercices)
  - onboarding salle temporairement désactivé (pas de gym-wait, home accessible)
  - post-inscription : discovery, notifications, puis « Ta première séance » (`client/e2e/smoke/onboarding/post-auth-discovery-notifications.spec.ts`)
  - accueil nouvel inscrit : carte « Ta première séance » et modification du rappel (`client/e2e/smoke/home/home-first-session-card.spec.ts`)
  - exercices : zones avec « n suivis / n disponibles » (`client/e2e/smoke/exercises/browse-zone-counts.spec.ts`)
  - exercices : perf depuis la liste suivis ouvre la fiche (`client/e2e/smoke/exercises/tracked-list-log-perf.spec.ts`)
  - onglet Social : classement, amis, en séance, dernières séances (`client/e2e/smoke/social/social-tab.spec.ts`)
  - bottom nav : 4 onglets Accueil · Exercices · Social · Réglages (`client/e2e/smoke/nav/bottom-nav.spec.ts`)
  - cloche notifications sur l'accueil (drawer vide)
  - accueil : semaine, rappel « Ta prochaine séance » si aujourd'hui ou demain est vide, CTA « Démarrer une séance » vers le catalogue
  - démarrer une séance : pas de paywall si limite d'exercices atteinte (`client/e2e/smoke/home/start-session-no-paywall.spec.ts`)
  - fin de séance : « Terminer » appelle l'API puis ouvre la page séance en mode récap hybride (`client/e2e/smoke/session/session-end-recap.spec.ts`)
  - page séance by id + commentaires / réactions (`client/e2e/smoke/session/session-view.spec.ts`)
  - partage story depuis le récap hybride (`client/e2e/smoke/session/recap-share-story.spec.ts`)
  - barre de séance live (`client/e2e/smoke/session/session-live-bar.spec.ts`)
  - fin de séance : « Terminer » appelle l'API puis ouvre le récap de séance
  - landing store web (CTA unique vers le OneLink AppsFlyer)

Durée typique : ~1 à 2 min (typecheck + build API + lint + smoke Playwright).

Pour un typecheck complet du client (hors scope du hook) : `npm run typecheck --prefix client`.

## Commandes manuelles

```bash
task check          # filet rapide
task check:smoke    # smoke Playwright
task check:all      # les deux
```

Depuis la racine :

```bash
npm run check:fast
npm run check:smoke
```

## Bypass d'urgence

```bash
git commit --no-verify
```

À réserver aux cas exceptionnels.

## Ajouter un parcours smoke

1. Créer le spec dans [`client/e2e/smoke/<feature>/`](../client/e2e/smoke/) (voir rule `e2e-feature-organization`).
2. Réutiliser [`helpers.ts`](../client/e2e/smoke/helpers.ts) et [`workflow-api.ts`](../client/e2e/smoke/workflow-api.ts) via `../`.
3. Vérifier les sélecteurs sur le texte UI français (`UI.*` dans `translations.ts`).
4. Lancer `task check:smoke` avant de committer (aussi lancé par le pre-commit).

Pour générer un test à partir d'une description : skill [`.cursor/skills/e2e-test/SKILL.md`](../.cursor/skills/e2e-test/SKILL.md).

## Ce que ça attrape

| Problème | Couche |
|----------|--------|
| Import manquant (`peekPendingInviteCode`) | pre-commit (TypeScript) |
| Erreur JS au runtime sur l'inscription | pre-commit (Playwright) |
| Session non effacée au logout | pre-commit (Playwright) |
| Ajout exercice / perf ne navigue pas | pre-commit (Playwright) |
| `setBrokenImageIds` ou erreur JS catalogue | pre-commit (Playwright) |

## Timer de repos (tests manuels mobile)

Non couvert par Playwright. À valider sur **appareil physique** après changement du plugin [`rest-timer`](../client/plugins/rest-timer/) :

| Scénario | Android | iOS (16.2+) |
|----------|---------|-------------|
| Perf enregistrée | Notif ongoing avec chrono + progression | Live Activity visible |
| Écran verrouillé jusqu'à la fin | Fin à ±1 s, son natif | Live Activity « terminé » |
| App au premier plan | Toast + son Web Audio, pas de notif système | Live Activity masquée |
| Changement cible (+/- 15 s) | Notif resynchronisée | Live Activity mise à jour |
| Nouvelle perf | Ancien timer annulé | Idem |
| Tap notif / Live Activity | Ouvre `/exercise/{id}` | Idem |

Build iOS : ouvrir `App.xcworkspace`, cible `OneMoreRestTimer` incluse. `pod install` après `cap sync`.
