# Historique & profil : feed de séances (pas par jour)

Date : 2026-10-09  
Statut : validé (design)

## Problème

L’historique (`HistoryPage`) et le bloc récent du profil (`ProfileRecentHistory`) agrègent encore les perfs **par jour** via `HistoryDaySection` + `groupByDayThenExercise`. Deux séances le même jour sont fusionnées en un seul bloc.

L’accueil affiche déjà chaque séance séparément (`HomeDaySessions` → `HomePastSession`).

## Objectif

- Afficher une **liste chronologique de séances** (unit = séance first-class), pas un jour fusionné.
- Réutiliser les **mêmes composants** que l’accueil (`HomePastSession`, `HomeExerciseList`).
- Sur historique + profil uniquement : teaser récap en **encart compact**.
- Lecture seule : édition des séries uniquement depuis la fiche exercice.

## Décisions produit

| Sujet | Choix |
|---|---|
| Unité d’affichage | Séance (`sessionId`), pas jour |
| Composant | `HomePastSession` (comme l’accueil) |
| Chargement | API existante jour par jour : `GET /sessions/:ownerUserId/day/:date` |
| Nouvel endpoint recent | Non (hors scope) |
| Historique | Feed des séances dérivées des ~150 dernières perfs |
| Profil | **2** dernières séances + lien « Voir tout » → `/history` |
| Récap teaser | `variant="compact"` sur historique/profil seulement ; accueil inchangé |
| Édition inline | Supprimée sur historique/profil (read-only) |
| Accueil | Hors scope, inchangé |

## Architecture

### Flux données

1. Perfs actives (non deleted) → jours distincts, triés récents d’abord.
2. Pour chaque `dayKey` : `useDaySessions(ownerUserId, dayKey)` (SWR, parallèle).
3. Aplatir `items` de tous les jours → tri par `startedAt` desc.
4. Rendre une liste de `HomePastSession`.

### Nouveaux / adaptés

| Élément | Rôle |
|---|---|
| `useSessionsFeed(ownerUserId, dayKeys)` | Charge les jours, retourne `{ items: DaySessionSummary[], isLoading }` |
| `SessionFeed` | Liste espacée de `HomePastSession` + skeleton |
| `HomePastSession` | Prop `recapVariant?: "default" \| "compact"` (défaut `default`) |
| `HomeRecapTeaser` | Prop `variant?: "default" \| "compact"` |

### Pages

- **Historique** : `HistoryWeekStreak` inchangé → `SessionFeed` (tous les jours des perfs affichées) → empty state existant. Retrait des `AddPerfDrawer` / edit-delete inline.
- **Profil** : `ProfileRecentHistory` utilise `SessionFeed` limité à 2 séances + lien Voir tout. Mode ami / `readOnly` : même feed.

## UI

### Titres (alignés multi-séances accueil)

- Première séance d’un jour (plus récente) : `formatHomeDayTitle(dayKey)`.
- Séances suivantes le même jour : `formatTimeOnly(startedAt)`.
- Durée à droite via le timing existant dans `HomePastSession`.

### Récap compact

- Hauteur cible ~72px (vs `min-h-[112px]` actuel).
- Padding et typos réduits ; CTA en une ligne.
- Barres de volume max ~32px (vs 52).
- Même destination (page séance), même image / fond sombre.

## Edge cases

| Cas | Comportement |
|---|---|
| Échec d’un jour API | Message local / skip ; le reste du feed s’affiche |
| Aucune perf | Empty states existants ; profil : section masquée si vide |
| Pas d’`ownerUserId` | Pas de feed séances |
| Ami (profil) | `sessionOwnerUserId` pour les fetches day-sessions |

## Hors scope

- Accueil (`HomePage`, `HomeDaySessions`)
- Nouvel endpoint `GET …/recent`
- Page `/session/:sessionId`
- Smoke e2e history/profil (optionnel plus tard)
- Suppression immédiate de `HistoryDaySection` / `HistoryExerciseCollapsible` s’ils restent unused (cleanup secondaire)

## Critères de succès

1. Deux séances le même jour → **deux** blocs distincts sur historique et profil.
2. Chaque bloc = titre + durée, récap (compact hors accueil), liste d’exercices comme l’accueil.
3. Profil : au plus 2 séances + lien Voir tout.
4. Accueil et page séance inchangés.
5. Plus d’édition / suppression de perf depuis historique ou profil.

## Lien

Complète le modèle multi-séances décrit dans [`2026-10-09-multi-session-hybrid-recap-design.md`](./2026-10-09-multi-session-hybrid-recap-design.md) côté surfaces historique / profil.
