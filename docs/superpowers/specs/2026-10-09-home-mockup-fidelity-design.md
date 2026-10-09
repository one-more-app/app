# Accueil · fidélité maquettes (captures 10–36)

Date : 2026-10-09  
Statut : validé (design)  
Référence : [`docs/redesign-accueil/HANDOFF.md`](../../redesign-accueil/HANDOFF.md), captures `screens/10`–`36`, prototype `prototype-source.html`

## Objectif

Aligner le rendu et le comportement de la page d’accueil sur les maquettes validées (captures `10`–`36`), sans changer le modèle de données ni les hooks existants. Thème clair = référence pixel-proche. Thème sombre = mêmes structures via tokens (`bg-card`, `foreground`, etc.), sans viser un match pixel sombre.

## Décision

Approche **kit UI home partagé, puis alignement état par état** :

1. Extraire / unifier les blocs visuels qui divergent des maquettes.
2. Brancher live et passé sur le même composant de liste.
3. Passer chaque état `10`–`36` sur ce kit avec checklist visuelle.

Hors scope (lots HANDOFF 4–7 et hors captures accueil) : page Récap dédiée, partage story, post-inscription `01`–`05`, onglets Social / Exercices revus, nouvelles API.

## Architecture · kit UI

Trois blocs à créer ou revoir dans `client/src/components/home/` :

| Bloc | Rôle |
|---|---|
| `HomeExerciseList` (nouveau) | Une seule `Card` blanche : vignette → fiche, nom dépliable, puce séries, `RankBadge`, action droite ; panel séries (poids × reps, pastille Record lime, crayon si live) |
| `HomeRecapTeaser` (revu) | Fond photo sombre + gradient, label lime, headline, « Voir le récap », mini barres volume (dernière en lime) |
| `HomeWeekStrip` (revu) | Bulles semaine : flamme orange (séance), numéro, pointillés futurs, sélection soulignée ; série perdue → check lime sur jours actifs |

La note de série (gardée / risque + countdown / rien si perdue) et le slot flamme grise restent dans `HomeProgressWeekCard` (pas de fichier dédié obligatoire).

### Modes de `HomeExerciseList`

- `live` : bouton `+` noir → `AddPerfDrawer` ; édition des séries.
- `past` : chevron ; lecture seule (pas de crayon).

Réutiliser : `ExerciseImage`, `ExerciseTitle`, `RankBadge`, `AddPerfDrawer`, `EmptyState`, `SessionCommentsThread`, `ReactionBubbles`, `XpProgressBlock`, `StreakFlameCount`, `Card`, `Button`.

Ne pas copier le HTML du prototype.

## Mapping états (captures)

| Capture | État | Contenu |
|---|---|---|
| `10`–`12` | Nouvel inscrit, aujourd’hui vide | `HomeFirstSessionCard` (aucun / jours / salle) ; pas de « Dernière séance » ; CTA démarrer |
| `20`, `21`, `23` | Séance live | Titre + point pulsant + chrono ; liste `mode=live` ; « Ajouter un exercice » ; commentaires seulement s’il y en a ; barre live déjà montée (`SessionLiveBar`) |
| `30`, `31`, `35` | Jour passé avec séance | Titre date + horaires + durée ; teaser récap ; liste `mode=past` ; commentaires si présents ; CTA démarrer |
| `32`, `34` | Repos / à venir | `EmptyState` + bloc **Dernière séance** (lien jour + teaser) |
| `33` | Aujourd’hui vide (habitué) | EmptyState haltère + **Dernière séance** + CTA |
| `35` | Série à risque | Bandeau orange + countdown dans la carte XP |
| `36` | Série perdue | Flamme grise / 0, pas de pastille `+XP` ; jours actifs en check lime (pas flamme orange) |

### Règles transverses

- Jour par défaut : `resolveDefaultHomeDay` (live ou nouvel inscrit → aujourd’hui, sinon dernier jour avec séance).
- CTA « Démarrer une séance » : visible hors séance live, fixe au-dessus de la bottom nav.
- Copy : chaînes `UI.*` / prototype ; aucun `--` ni `—` (règle copywriting).
- Accents : lime `#DFFF5E` pour records / CTA rappel ; orange pour série ; jamais de rouge pour un record.
- Chiffres : police One More (`font-one-more` / figures).

## Données

Aucun nouvel endpoint. Sources existantes :

| Besoin | Source |
|---|---|
| Perfs | `usePerformanceEntriesData` + local (`mergePerformanceEntriesById`) |
| Séance du jour | `useHomeDaySession` |
| Progression / XP | `useUserProgressData` |
| Série | `resolveHomeStreak` + `resolveStreakXpBonus` |
| Exercices home | `useHomeData` / tracked |
| Première séance / rappel | prefs notif + `useUserGymData` |
| Live / chrono | `useSessionTiming`, `useSessionLive` |

## Erreurs et fallbacks

- Session API en échec : message `UI.sessionUnavailable`, pas de liste fantôme.
- Teaser sans highlights : headline « n exercices » (déjà en place).
- Image hero absente : fond sombre uni, layout intact.
- Asset teaser récap : réutiliser `public/images/first-session-hero.jpg` par défaut ; asset dédié `recap-session-hero.jpg` seulement si un visuel distinct est fourni.

## Fichiers touchés

**Créer**

- `client/src/components/home/HomeExerciseList.tsx` (éventuel sous-composant de ligne interne)

**Modifier**

- `HomeLiveSession.tsx` → consomme `HomeExerciseList` (`mode="live"`)
- `HomePastSession.tsx` → idem (`mode="past"`), ne plus s’appuyer sur `HistoryDaySection` pour l’accueil
- `HomeRecapTeaser.tsx` → hero photo + gradient
- `HomeWeekStrip.tsx` → cas série perdue (check lime)
- `HomeProgressWeekCard.tsx` → brancher le mode « lost » sur la strip ; densités
- `HomeFirstSessionCard.tsx`, empty states, `HomeStartSessionCta.tsx`, `HomeDayTitle.tsx`, `HomeLastSessionBlock.tsx` → densités / typo vs captures
- `client/src/lib/translations.ts` seulement si un libellé manque vs prototype
- Smoke e2e `client/e2e/smoke/home/*` si sélecteurs cassés ; ajouter un parcours jour passé / liste si utile

**Barre live (`SessionLiveBar`)**

Présente sur les captures `20` / `21` / `23` : incluse dans la checklist visuelle. Pas de refonte structurelle dans ce lot ; corriger seulement les écarts évidents de densités / labels si le kit home les fait ressortir. Hors scope : tiroir Terminer, popover chrono (`22`) sauf s’il bloque la checklist, pages Récap / Social / Exercices.

## Critère de done

1. Checklist visuelle claire : chaque PNG `10`–`36` vs rendu thème clair.
2. Smoke home verts (`home-structure`, `home-first-session-card`, et tout nouveau spec).
3. Lint OK.
4. Pas de nouvelle API ; pas de `--` / `—` dans le copy.

## Décisions figées

- Approche kit partagé (pas audit-only, pas rebuild depuis le HTML prototype).
- Thème sombre : structures + tokens, pas pixel-match.
- Scope = captures accueil `10`–`36` uniquement.
