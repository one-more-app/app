# Bottom nav · alignement maquettes redesign

Date : 2026-10-09  
Statut : implémenté  
Référence : [`docs/redesign-accueil/HANDOFF.md`](../../redesign-accueil/HANDOFF.md) §7 Onglets, captures `10`, `50`, `52`, `55`, prototype `NAV()` dans `prototype-source.html`

## Objectif

Remplacer la bottom nav actuelle (5 onglets icônes seuls) par les **4 onglets maquette** avec labels et pastille lime, sans refondre le contenu des pages Social / Exercices (lot HANDOFF 7).

## Décisions produit

| Sujet | Choix |
|---|---|
| Scope | Approche « nav seule » : `BottomNav` + host + tours + e2e. Pas de redesign pages. |
| Onglets | Accueil · Exercices · Social · Réglages |
| Nav sur pages nested | Visible (Profil, Amis, Classement, Historique legacy) |
| Actif sur `/profile` | Accueil |
| Actif sur `/friends*`, `/ranking` | Social |
| Badge non lu | Onglet Social **et** en-tête page Social (déjà branché via `useFriendsBadgeCount`) |
| `/history` | Route conservée ; plus dans la nav ; si ouverte en deep link, nav visible, **aucun** onglet actif |
| Contenu Social / Exercices | Hors scope |

## IA et matching actif

| Onglet | `to` | Icône lucide | Label UI |
|---|---|---|---|
| Accueil | `/home` | `Home` | Accueil |
| Exercices | `/exercises` | `Dumbbell` | Exercices |
| Social | `/social` | `Users` | Social (`UI.navSocial`) |
| Réglages | `/settings` | `Settings` | Réglages (chaîne dédiée nav si besoin ; page reste « Paramètres ») |

Règles `aria-current` / style actif :

- Accueil : `pathname === '/home'` **ou** `pathname === '/profile'`
- Exercices : `pathname === '/exercises'` (la fiche `/exercise/:id` garde la nav masquée comme aujourd’hui)
- Social : `pathname === '/social'` **ou** `pathname === '/ranking'` **ou** `pathname === '/friends'` **ou** préfixe `/friends/`
- Réglages : `pathname === '/settings'`

## Visibilité (`BottomNavHost`)

Afficher la nav sur :

- `/home`, `/exercises`, `/social`, `/settings` (onglets)
- `/profile`, `/ranking`, `/friends`, `/friends/preview/*` (nested, choix produit)
- `/history`, `/stats` (legacy / redirects existants)

Ne pas ajouter la nav sur `/exercise/:id` (comportement actuel + barre séance).

## Visuel

Référence prototype :

```text
.nav height ~72px ; .nvi 48×32 rounded-10 ; actif background accent ; label 10px
```

- Fond `bg-card`, `border-t border-border`, safe-area `pb/pl/pr`
- Item : colonne, label sous l’icône
- Actif : pastille `bg-accent` + icône `text-accent-foreground` + label `text-foreground font-semibold`
- Inactif : pas de fond, `text-muted-foreground`
- Badge Social : `UnreadCountBadge` ancré sur la pastille (équivalent Amis actuel) ; réutiliser `UI.navFriendsBadgeAria` avec le label Social
- Recalibrer `--bottom-nav-height` si les labels dépassent 4rem (évite collision CTA / `SessionLiveBar`)
- Copy : aucun `--` ni `—` ; tutoiement inchangé

Ne pas copier le HTML du prototype.

## Tours

| Tour | Action |
|---|---|
| `HomeTour` | Remplacer cibles `nav-profile`, `nav-history`, `nav-friends` par les nouveaux `data-tour` (`nav-exercises`, `nav-social`, `nav-settings`) et adapter le copy des steps |
| `RankingTour` | Conserver `nav-social` |

## Fichiers

**Modifier**

- `client/src/components/BottomNav.tsx`
- `client/src/App.tsx` (`BottomNavHost`)
- `client/src/index.css` (`--bottom-nav-height` si besoin)
- `client/src/lib/translations.ts` (label Réglages nav, aria badge Social, steps HomeTour si strings UI)
- `client/src/components/HomeTour.tsx`
- Smoke e2e qui ciblent l’ancienne nav (`client/e2e/smoke/**`)

**Ne pas modifier** (ce lot)

- Contenu `SocialPage`, `ExerciseListPage`, `SettingsPage`, `HistoryPage`
- API, hooks métier hors badge déjà existant

## Erreurs / edge cases

- Deep link `/history` : nav visible, aucun onglet actif, pas de crash
- Badge à 0 : rien affiché (comportement `UnreadCountBadge` actuel)
- Thème sombre : mêmes structures via tokens (`bg-card`, `accent`, `muted-foreground`)

## Critère de done

1. Nav à 4 onglets avec labels ; pastille lime sur l’actif (captures `10` / `50` / `52` / `55`)
2. Matching actif parent (Profil→Accueil, Amis/Classement→Social)
3. Badge Social nav + header Social
4. HomeTour / RankingTour opérationnels
5. Smoke e2e verts + lint OK
6. Aucun `--` / `—` dans le copy ajouté

## Hors scope explicite

- Refonte contenu onglets Social / Exercices (HANDOFF lot 7)
- Redirect ou suppression de `/history`
- Changer le titre page Paramètres en « Réglages »
- Afficher la nav sur la fiche exercice
