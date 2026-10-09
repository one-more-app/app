# Séance · réactions au niveau séance + carte commentaires (maquette)

Date : 2026-10-09  
Statut : validé (design)  
Référence : [`docs/redesign-accueil/HANDOFF.md`](../../redesign-accueil/HANDOFF.md), capture `screens/24-ma-seance-en-cours.png`, `prototype-source.html` (`seanceBody`)

## Objectif

Aligner le système social de la séance sur la maquette : **réactions sur la séance entière** (pas sur chaque exercice), et **bloc messages** dans une carte « Commentaires » fidèle au prototype. Pas de changement de modèle API ni de dépréciation `targetType: "exercise"`.

## Décisions produit

| Sujet | Choix |
|---|---|
| Visibilité du bloc | **A** : affiché seulement si `commentCount > 0` (réactions masquées s’il n’y a aucun commentaire) |
| Threading messages | **C** : garder réponses imbriquées + Répondre / Modifier ; aligner le style seulement |
| Scope technique | **Approche 1** : UI only (API `exercise` reste, non exposée) |

## Architecture

### Placement

Sur **accueil** (séance live / jour passé) et **`SessionPage`** :

1. Titre « Commentaires » hors carte (`UI.sessionCommentsTitle`).
2. Une carte blanche unique contenant, dans l’ordre :
   - rangée `ReactionBubbles` (réactions **séance**)
   - liste des messages (`SessionCommentItem`, threading inchangé)
   - composeur (`SessionCommentComposer`)
3. Aucune réaction sous une ligne d’exercice.

### Visibilité (détail)

| Surface | Règle |
|---|---|
| Accueil (live / passé) | Bloc entier (titre + carte) **seulement si** `commentCount > 0` (maquette / choix A). |
| `SessionPage` | Thread **toujours** monté (carte + composeur), pour permettre le **premier** commentaire. Rangée réactions toujours en haut de carte. |

Sans cette exception sur `SessionPage`, le gate strict sur tous les écrans rendrait le premier message impossible (composeur masqué tant qu’il n’y a aucun commentaire).

### Données

- Lecture : `session.reactions` (déjà renvoyé par `GET` séance).
- Toggle : `toggleSessionReaction(ownerUserId, date, { emoji, targetType: "session" })`.
- Cache SWR : `applySessionReactionTarget` (branche `targetType === "session"`).
- Realtime `session:reaction` : inchangé.
- `reactionsByExerciseId` : plus consommé côté client ; pas de migration / pas de nettoyage API dans ce lot.

### Erreurs

Toasts existants : `UI.sessionReactionError`, `UI.sessionCommentError`.

## Visuel

Référence : capture `24` + HTML `seanceBody` (pills + rows commentaires).

### Réactions

- Pills horizontales wrap : emoji + compteur seulement si `count > 0`.
- État `reactedByMe` plus marqué (bordure / fond muted).
- Long-press → drawer personnes (comportement actuel de `ReactionBubbles`).
- Emojis : `SESSION_REACTION_EMOJIS` (🔥 💪 👏 😮 ❤️).

### Messages

- Avatar ~32px, gap ~10px.
- Ligne méta : nom `font-medium` + ` · ` + temps relatif / court (`il y a 12 min`, `mardi`, etc.).
- Corps : `text-sm`, `whitespace-pre-wrap`.
- Réponses : indentation actuelle ; actions Répondre / Modifier en `text-xs` muted (pas mises en avant dans la maquette, conservées).

### Composeur

- Dans la carte : input + bouton sombre « Envoyer ».
- Pas de barre sticky séparée hors carte sur ces écrans (le clavier reste géré via classes safe-area / input existantes).

### Copy

Chaînes via `UI.*` ; aucun `--` ni `—` (règle copywriting).

## Fichiers touchés (client)

| Fichier | Action |
|---|---|
| `SessionCommentsThread.tsx` | Carte + intégrer `ReactionBubbles` + props `reactions` / `onToggleReaction` / `currentUserId` |
| `SessionCommentItem.tsx` | Style maquette (avatar, typo, temps) |
| `SessionCommentComposer.tsx` | Style input + bouton dans la carte |
| `HomeLiveSession.tsx` | Retirer réactions exo ; passer réactions séance au thread |
| `HomePastSession.tsx` | Idem |
| `HomeExerciseList.tsx` | Retirer props / rendu `ReactionBubbles` |
| `SessionPage.tsx` | Réactions séance dans le thread ; retirer `reactionsByExerciseId` des sections ; thread toujours monté |
| `HistoryDaySection.tsx` / `HistoryExerciseCollapsible.tsx` | Retirer câblage réactions exo |

Hors scope : dépréciation API `targetType: "exercise"`, notifs « réaction sur un exercice », redesign onglet Social (`52`), page récap.

## Tests

- Ajuster smoke session / home si des assertions ciblent des réactions par exercice.
- Pas de nouveau parcours e2e obligatoire si le thread commentaires est déjà couvert.
- Vérif manuelle : capture `24` (carte commentaires), séance sans commentaire (bloc absent), toggle réaction séance + realtime.

## Critères de succès

1. Aucune UI de réaction sur une ligne d’exercice (accueil + page séance + historique séance).
2. Accueil + `commentCount > 0` : carte fidèle à `24` (réactions + messages + composeur).
3. Accueil + `commentCount === 0` : pas de bloc Commentaires. `SessionPage` : carte toujours visible (réactions + liste éventuelle + composeur).
4. Répondre / Modifier / realtime / drawer personnes toujours fonctionnels.
5. Lint + smoke concernés verts.
