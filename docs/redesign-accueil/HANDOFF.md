# One More · Refonte accueil et séance : dossier pour Cursor

Ce dossier décrit la nouvelle version de l'accueil, de la séance en cours, du récap et du parcours post-inscription, telle que validée sur le prototype cliquable.

## Contenu du dossier

| Fichier | Rôle |
|:-|:-|
| `HANDOFF.md` | Ce document : spec écran par écran, mapping vers le code, ordre de travail |
| `CURSOR_PROMPT.md` | Prompt prêt à coller dans Cursor (un par lot) |
| `prototype.html` | Prototype autonome. Ouvre-le dans un navigateur : panneau de droite = scénarios et réglages (profil, rappel, séance, chrono, série) |
| `prototype-source.html` | Même prototype en source lisible (images remplacées par `__HERO__`, `__STORY__`, `__LOGO__`, `__FONT__`). C'est celui que Cursor doit lire |
| `screens/*.png` | Captures de chaque écran et de chaque état, numérotées par zone |

Le prototype est une maquette HTML : **il ne faut pas copier son code**. Il sert de référence visuelle et fonctionnelle. L'implémentation se fait avec les composants existants de `client/src` et les règles de `.cursor/rules`.

## Règles générales pour l'implémentation

1. Réutiliser les composants existants avant d'en créer : `RankBadge`, `LeagueBadge`, `StreakFlameCount`, `XpProgressBlock`, `UserProgressCard`, `ExerciseImage`, `ExerciseTitle`, `AddPerfDrawer`, `RestSinceLastSetBar`, `RestTargetQuickEdit`, `SessionCommentsThread`, `ReactionBubbles`, `SessionTimingLabel`, `EmptyState`, `BottomNav`, `CelebrationShareCard`.
2. Respecter `.cursor/rules` : surtout `rest-timer.mdc`, `typography.mdc`, `copywriting-french.mdc`, `accent-contrast.mdc`, `animations.mdc`, `mobile-safe-area.mdc`, `openpanel-tracking.mdc`.
3. Les données du prototype sont fictives. Tout doit être branché sur les hooks existants (`useHomeData`, `useSessionLive`, `useSessionTiming`, etc.) et l'API.
4. Textes : reprendre exactement ceux du prototype (en français), sans tiret double.
5. Couleurs : lime `#DFFF5E` pour les accents positifs (Record, +, repos), orange pour la série de flammes. **Jamais de rouge** pour un record.
6. Chiffres en police One More (comme aujourd'hui).
7. Un lot = une PR, testée sur mobile (iOS et Android) avant de passer au suivant.

## Spec écran par écran

Légende des tags du prototype : **Nouveau** (n'existe pas), **Revu** (existe, modifié), **Existant** (inchangé, présent pour le parcours).

### 1. Post-inscription (Nouveau) · captures 01 à 05

- **Commencer** (`01`) : photo plein écran, titre "Ta première séance t'attend", 3 puces (choisis ton exercice, note ta série et le repos se lance, bats-toi la fois suivante). Boutons "Commencer ma séance" (lime) et "Je m'entraîne plus tard".
- **Tu t'entraînes quand ?** (`02`) : deux options. "Mes jours d'entraînement" (sélection des jours + heure, rappel à l'heure de la séance) ou "Quand j'arrive à ma salle" (renvoie vers la recherche de salle existante). CTA "Activer les notifications".
- **C'est noté** (`03`) : confirmation avec le jour et l'heure du prochain rappel, ce qui se passe à la première séance, et "Commencer maintenant" / "Aller à l'accueil".
- **Salle** (`04`, `05`) : écrans existants (`GymSearchPicker`, `OnboardingGymPermissionsStep`) réutilisés tels quels.

### 2. Accueil (Revu) · captures 10 à 36

Structure de haut en bas :

1. **En-tête** : avatar, nom, badge de rang, cloche de notifications (point si non lues).
2. **Carte progression** : niveau, barre XP, flamme de série + pastille "+10% XP", puis **semaine navigable** (Lun à Dim, aujourd'hui = "Auj.", jour sélectionné souligné, jours avec séance = flamme). Sous la semaine, la note de série :
   - série en cours : "Série gardée jusqu'à vendredi minuit" (gris, icône horloge)
   - dernier jour (`35`) : bandeau orange "Tu perds ta série et ton bonus ce soir à minuit" + compte à rebours
   - série perdue (`36`) : flamme grise, pas de bonus
3. **Contenu du jour sélectionné** (le jour par défaut est aujourd'hui si une séance est en cours ou si l'utilisateur est nouveau, sinon le dernier jour avec séance) :
   - **Aujourd'hui, séance en cours** (`20`) : titre "Séance en cours" avec point pulsant et chrono à droite. Liste des exercices dans une seule carte blanche, une ligne par exercice : vignette (ouvre la fiche), nom, puce "n séries", rang, bouton rond noir **+** (ouvre `AddPerfDrawer`). Toucher le nom déplie les séries (`23`) : poids × reps, pastille "Record" lime, crayon pour modifier. Puis "Ajouter un exercice". Puis "Commentaires" **seulement si quelqu'un a commenté**.
   - **Aujourd'hui, nouvel inscrit** (`10`, `11`, `12`) : carte photo sombre "Ta première séance" avec 3 cas selon le rappel (aucun, jours, salle), bouton "Activer un rappel" (lime) ou "Modifier mon rappel" (translucide, sans bordure).
   - **Aujourd'hui, habitué sans séance** (`33`) : `EmptyState` simple (icône haltère grise, "Pas encore de séance aujourd'hui", texte d'aide), bien espacé, sans info en plus. En dessous : bloc **Dernière séance**.
   - **Jour passé avec séance** (`30`, `31`) : titre date, heures et durée à droite. Si un récap existe : **carte récap visuelle** (photo sombre, "Récap de séance" en lime, "2 records battus", "Voir le récap", mini graphique de volume avec la dernière barre en lime). Puis la liste des exercices en lecture seule (chevron à la place du +, dépliable). Puis commentaires s'il y en a.
   - **Jour de repos / sans séance / à venir** (`32`, `34`) : `EmptyState` (horloge, haltère ou calendrier), puis bloc **Dernière séance** (titre + lien "Mardi 6 · 1h12" vers ce jour + carte récap visuelle).
4. **CTA fixe "Démarrer une séance"** (noir) au dessus de la nav, visible dès qu'aucune séance n'est en cours.

### 3. Barre de séance en cours (Nouveau) · captures 20, 21, 22

Bloc noir collé au dessus de la `BottomNav`, visible pendant une séance sur l'accueil et sur la fiche exercice. Deux rangées :

- **Rangée exercice** : vignette + "Exercice · n séries" + nom (toucher = ouvre la fiche de l'exercice en cours), bouton **+** lime à droite (ajoute une série à cet exercice).
- **Rangée du bas**, une seule à la fois :
  - hors repos : "Séance · n séries" + chrono de séance + bouton "Terminer" (ouvre le tiroir Terminer la séance)
  - en repos (`21`) : rangée lime, "Repos" + compte à rebours, puce du temps cible (ouvre le popover `RestTargetQuickEdit` existant : −/+15 s, préréglages 1:00 à 3:00, bornes 30 s à 5 min, défaut 90 s) (`22`), bouton "Passer". Le temps cible n'est réglable que pendant le repos.

Source de vérité du repos : `RestSinceLastSetBar` et la règle `rest-timer.mdc`. La barre fine actuelle est remplacée par cette rangée, la logique reste la même.

### 4. Ma séance (Revu) · capture 24

Accessible depuis la barre de séance. En-tête "Ma séance", date + chrono, pastille "En cours" (point pulsant). Même liste d'exercices que l'accueil, "Ajouter un exercice", commentaires si présents. Pour une séance passée : pastille "Terminée", lecture seule. Correspond à `SessionPage` (`/session/:ownerUserId/:date`).

### 5. Récap de séance (Nouveau) · captures 40 à 42

- En-tête "Récap de séance", date et horaires, bouton partager.
- Carte **Volume soulevé** : total en grand, barres des 6 dernières séances (la dernière en noir avec étiquette lime), puis Durée, Exos, Séries, XP.
- **Partager en story** : 4 miniatures (Stats, Muscles, Records, Ligue) et "Tout voir". Toucher ouvre le tiroir story (`42`) : aperçu 9:16, onglets de sticker, choix "Sur ma photo" / "Sticker transparent", "Enregistrer" et "Partager en story". S'appuyer sur `components/share`.
- **Nouveaux records** : une carte par record (vignette, nom, rang, pastille Record lime, valeur).
- CTA lime "Partager en story" en bas.
- Pas de liste "Ta séance" dans le récap.

### 6. Tiroirs · captures 60 à 63

- **Nouvelle performance** (`60`) : `AddPerfDrawer` existant, inchangé.
- **Terminer la séance ?** (`61`, Nouveau) : 3 stats (exercices, séries, durée), texte "Ton récap est prêt, tes potes pourront réagir", "Terminer et voir mon récap" (lime), "Continuer la séance".
- **Notifications** (`62`) : nouveaux types (séance en cours d'un pote, nouveau record, série en danger, réaction sur ta séance).
- **Parrainage** (`63`) : existant.

### 7. Onglets · captures 50 à 56

- **Exercices** (`50`, Revu) : exercices suivis et catalogue mélangés par zone du corps, avec "n suivis / n disponibles".
- **Social** (`52`, Nouveau) : carte classement (rang, XP du mois), amis, promo Pro parrainage, "En train de s'entraîner", "Dernières séances de tes amis".
- **Fiche exercice, Classement, Amis, Réglages, Profil** (`51`, `53` à `56`) : existants, seulement pour le parcours.

## Ordre de travail conseillé (un lot = une PR)

1. **Accueil, structure** : semaine navigable + contenu par jour (jour passé, repos, à venir, aujourd'hui vide, Dernière séance, CTA fixe).
2. **Accueil, séance en cours** : liste d'exercices avec + et séries dépliables, commentaires conditionnels.
3. **Barre de séance en cours** au dessus de la nav (rangée exercice, rangée séance ou repos, popover chrono).
4. **Tiroir Terminer la séance** + **Récap de séance** (sans le partage).
5. **Partage en story** depuis le récap.
6. **Post-inscription** (Commencer, rappel jours ou salle, C'est noté) + bloc "Ta première séance" sur l'accueil.
7. **Onglet Social** et **Exercices** revu.

Pour chaque lot : tracking OpenPanel sur les nouvelles actions (voir `openpanel-tracking.mdc`), tests e2e si la règle le demande.
