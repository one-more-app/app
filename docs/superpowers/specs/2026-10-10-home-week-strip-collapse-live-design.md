# Accueil · replier la bande des jours en séance live

Date : 2026-10-10  
Statut : validé (design)

## Objectif

Pendant une séance en cours, libérer de la place sur l’accueil en masquant par défaut la bande des jours de la semaine, tout en permettant de la redéplier via un chevron. XP et série restent toujours visibles.

## Décisions produit

| Sujet | Choix |
|---|---|
| Quoi masquer | Uniquement `HomeWeekStrip` (+ note streak associée) |
| Quoi garder | Bloc XP + résumé série (`XpProgressBlock` / `StreakSummary`) |
| Contrôle | Chevron / bouton accordéon sous la barre XP |
| État initial live | Bande repliée |
| Persistance | Aucune : état local React ; quitter / revenir sur l’accueil → replié |
| Hors live | Bande toujours visible, pas de chevron |

## Comportement

1. `hasLiveSession === false` : rendu actuel inchangé (semaine + note streak visibles).
2. `hasLiveSession === true` :
   - semaine masquée tant que `weekExpanded === false` ;
   - un contrôle chevron sous XP permet d’ouvrir / fermer ;
   - `aria-expanded` + libellés i18n dédiés ;
   - la note streak (`StreakNote`) suit la visibilité de la bande.
3. Fin de séance (ou plus de live) : plus de contrôle, bande toujours affichée.

## Architecture

Approche retenue : état local dans `HomeProgressWeekCard`.

- `HomePage` passe la prop existante `hasLiveSession` à `HomeProgressWeekCard`.
- `HomeProgressWeekCard` :
  - `const [weekExpanded, setWeekExpanded] = useState(false)` ;
  - `const showWeek = !hasLiveSession || weekExpanded` ;
  - si `hasLiveSession`, rendre le bouton chevron (rotation quand ouvert) ;
  - si `showWeek`, rendre `HomeWeekStrip` + `StreakNote`.
- Pas de nouveau composant dédié, pas de `localStorage` / URL.

## Copy (i18n)

Ajouter dans `UI` (tutoiement, pas de tiret cadratin) :

- ouvrir : ex. « Afficher les jours de la semaine »
- fermer : ex. « Masquer les jours de la semaine »

Réutiliser `UI.homeWeekNavLabel` seulement s’il convient exactement ; sinon clés dédiées.

## Fichiers

**Modifier**

- `client/src/pages/HomePage.tsx` — passer `hasLiveSession`
- `client/src/components/home/HomeProgressWeekCard.tsx` — collapse + chevron
- `client/src/lib/translations.ts` — aria / labels du contrôle

**Hors scope**

- Redesign du strip ou de la card
- Collapse de tout le bloc progression
- Persistance du choix entre visites / séances
- E2E obligatoire (smoke manuelle suffisante pour ce lot)

## Tests

- Manuels : démarrer une séance → bande repliée + chevron ; déplier ; naviguer ailleurs puis revenir → repliée ; terminer la séance → bande visible sans chevron.
- Régression visuelle : hors live, card identique à avant.
