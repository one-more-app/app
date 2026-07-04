// Traduction des termes de l'API ExerciseDB (bodyPart, target, equipment)
// et des libellés UI

export const BODY_PARTS: Record<string, string> = {
  back: "Dos",
  cardio: "Cardio",
  chest: "Poitrine",
  "lower arms": "Avant-bras",
  "lower legs": "Jambes",
  neck: "Cou",
  shoulders: "Épaules",
  "upper arms": "Bras",
  "upper legs": "Cuisses",
  waist: "Taille",
};

export const TARGETS: Record<string, string> = {
  // Liste complète ExerciseDB API v1 /muscles
  "upper back": "Haut du dos",
  "lower back": "Bas du dos",
  lats: "Dorsaux",
  "latissimus dorsi": "Grand dorsal",
  chest: "Poitrine",
  "serratus anterior": "Dentelé antérieur",
  pectorals: "Pectoraux",
  shoulders: "Épaules",
  "upper arms": "Bras",
  "lower arms": "Avant-bras",
  abs: "Abdominaux",
  abdominals: "Abdominaux",
  "upper legs": "Cuisses",
  "lower legs": "Jambes",
  glutes: "Fessiers",
  hamstrings: "Ischio-jambiers",
  quadriceps: "Quadriceps",
  quads: "Quadriceps",
  "upper chest": "Haut des pectoraux",
  delts: "Épaules",
  deltoids: "Épaules",
  "rear deltoids": "Deltoïdes postérieurs",
  calves: "Mollets",
  soleus: "Soléaire",
  biceps: "Biceps",
  triceps: "Triceps",
  brachialis: "Brachial",
  forearms: "Avant-bras",
  "wrist flexors": "Fléchisseurs du poignet",
  "wrist extensors": "Extenseurs du poignet",
  "grip muscles": "Muscles de la prise",
  traps: "Trapèzes",
  trapezius: "Trapèzes",
  rhomboids: "Rhomboïdes",
  "levator scapulae": "Élévateur de la scapula",
  neck: "Cou",
  sternocleidomastoid: "Sterno-cléido-mastoïdien",
  cardio: "Cardio",
  "cardiovascular system": "Système cardiovasculaire",
  back: "Dos",
  spine: "Colonne vertébrale",
  "erector spinae": "Érecteurs du rachis",
  core: "Gainage",
  obliques: "Obliques",
  "lower abs": "Bas des abdominaux",
  "hip flexors": "Fléchisseurs de la hanche",
  groin: "Aine",
  "inner thighs": "Face interne des cuisses",
  adductors: "Adducteurs",
  abductors: "Abducteurs",
  "rotator cuff": "Coiffe des rotateurs",
  wrists: "Poignets",
  hands: "Mains",
  feet: "Pieds",
  ankles: "Chevilles",
  shins: "Tibias",
  "ankle stabilizers": "Stabilisateurs de cheville",
  "full body": "Corps entier",
};

/** Groupes d'équipements unifiés dans les filtres */
export const EQUIPMENT_GROUPS: Record<
  string,
  { ids: string[]; label: string }
> = {
  barres: {
    ids: ["barbell", "olympic barbell", "ez barbell"],
    label: "Barre / Barre EZ",
  },
  machines_lever_smith: {
    ids: ["leverage machine", "smith machine"],
    label: "Machine à levier / Smith",
  },
};

const EQUIPMENT_IN_GROUPS = new Set(
  Object.values(EQUIPMENT_GROUPS).flatMap((g) => g.ids),
);

export const EQUIPMENT: Record<string, string> = {
  // Liste complète ExerciseDB API v1
  barbell: "Barre",
  "olympic barbell": "Barre olympique",
  "ez barbell": "Barre EZ",
  "trap bar": "Barre hexagonale",
  dumbbell: "Haltère",
  kettlebell: "Kettlebell",
  "body weight": "Poids du corps",
  weighted: "Lesté",
  cable: "Câble",
  band: "Bande",
  "resistance band": "Bande élastique",
  "medicine ball": "Médecine-ball",
  "stability ball": "Ballon de stabilité",
  "bosu ball": "Bosu",
  "exercise ball": "Ballon d'exercice",
  rope: "Corde",
  roller: "Rouleau",
  "wheel roller": "Roue abdominale",
  "wrist roller": "Rouleau poignet",
  machine: "Machine",
  "smith machine": "Machine Smith",
  "leverage machine": "Machine à levier",
  "sled machine": "Traîneau",
  "elliptical machine": "Vélo elliptique",
  "stationary bike": "Vélo stationnaire",
  "stepmill machine": "Stepper",
  "skierg machine": "Ski ergomètre",
  "upper body ergometer": "Ergomètre haut du corps",
  hammer: "Poignée marteau",
  assisted: "Assisté",
  tire: "Pneu",
  "pull-up bar": "Barre de traction",
  "yoga mat": "Tapis de yoga",
  // Groupes d'équipements (pour les filtres)
  barres: "Barre",
  machines_lever_smith: "Machine",
};

/** Transforme une liste brute d'équipements en liste avec groupes unifiés */
export function getGroupedEquipmentList(rawList: string[]): string[] {
  const result: string[] = [];
  const hasBarres = rawList.some((e) =>
    EQUIPMENT_GROUPS.barres.ids.includes(e.toLowerCase()),
  );
  const hasMachines = rawList.some((e) =>
    EQUIPMENT_GROUPS.machines_lever_smith.ids.includes(e.toLowerCase()),
  );
  if (hasBarres) result.push("barres");
  if (hasMachines) result.push("machines_lever_smith");
  for (const eq of rawList) {
    if (!EQUIPMENT_IN_GROUPS.has(eq.toLowerCase())) result.push(eq);
  }
  return result.sort((a, b) => {
    const labelA = translateEquipment(a);
    const labelB = translateEquipment(b);
    return labelA.localeCompare(labelB);
  });
}

/** Indique si un équipement d'exercice correspond au filtre (inclut les groupes) */
export function equipmentMatchesFilter(
  exEquipment: string | undefined,
  filterValue: string,
): boolean {
  if (!exEquipment) return false;
  const eq = exEquipment.toLowerCase();
  const group = EQUIPMENT_GROUPS[filterValue];
  if (group) return group.ids.includes(eq);
  return eq === filterValue.toLowerCase();
}

export function translateBodyPart(en: string): string {
  return BODY_PARTS[en.toLowerCase()] ?? en;
}

export function translateTarget(en: string): string {
  return TARGETS[en.toLowerCase()] ?? en;
}

export function translateEquipment(en: string): string {
  const key = en.toLowerCase();
  if (key === "__unspecified__") return UI.browseUnspecifiedEquipment;
  return EQUIPMENT[key] ?? en;
}

// Libellés UI
export const UI = {
  addExercise: "Ajouter un exercice",
  chooseExercises: "Choisir des exercices",
  noTrackedExercises: "Aucun exercice suivi",
  noTrackedDescription:
    "Ajoutez des exercices pour commencer à suivre vos performances",
  muscleGroup: "Groupe musculaire",
  equipmentLabel: "Matériel",
  bodyPartLabel: "Partie du corps",
  editCustomClassification: "Modifier le classement",
  editCustomExercise: "Modifier l'exercice",
  customClassificationHint:
    "Le muscle et le matériel permettent de retrouver l'exercice dans le parcours par zone.",
  browseUnspecifiedEquipment: "Matériel non renseigné",
  all: "Tous",
  custom: "Personnalisé",
  newCustomExercise: "Nouvel exercice personnalisé",
  name: "Nom",
  category: "Catégorie",
  filterByBodyPart: "Filtrer par partie du corps",
  filterByTarget: "Filtrer par muscle",
  filterMusclesTitle: "Muscles",
  filterMusclesAll: "Tous les muscles",
  filterMusclesNSelected: "{n} muscles",
  filterMusclesReset: "Effacer",
  filterMusclesRefine: "Affiner les muscles",
  filterMusclesWholeGroup: "Tout le groupe",
  filterMusclesClosePanel: "Fermer",
  filterByEquipment: "Filtrer par matériel",
  add: "Ajouter",
  addAndRecordPerf: "Ajouter et enregistrer une perf",
  added: "Ajouté",
  last: "Dernier",
  record: "Record",
  reps: "Reps",
  weight: "Poids",
  addedWeight: "Poids lesté (kg)",
  weightPerDumbbell: "Poids par haltère (kg)",
  totalLoadHint: "Charge totale (corps + lest)",
  dumbbellWeightHint: "Poids d'un seul haltère",
  bodyWeightOnly: "Poids du corps",
  bodyWeightAbbr: "PDC",
  save: "Enregistrer",
  delete: "Supprimer",
  history: "Historique",
  historyWeekNavLabel: "Activité hebdomadaire",
  historyWeekPrev: "Semaine précédente",
  historyWeekNext: "Semaine suivante",
  historyWeekTrainedDay: "Entraîné · {day}",
  historyWeekRestDay: "Repos · {day}",
  historyWeekFutureDay: "À venir · {day}",
  historyGlobalSubtitle:
    "Par jour, puis par exercice ; chaque exercice se déplie pour voir les séries.",
  historySeriesCount: "{count} séries",
  historyOpenExerciseSheet: "Ouvrir la fiche exercice",
  noHistoryEntriesTitle: "Aucune performance enregistrée",
  noHistoryEntriesDescription:
    "Ajoute une performance pour voir ton historique.",
  exerciseRemovedFromTracking: "Exercice retiré du suivi",
  historyTruncated:
    "Affichage des {shown} entrées les plus récentes sur {total} au total.",
  lastSession: "Dernière session",
  previousSession: "Session plus récente",
  nextSession: "Session plus ancienne",
  leaguePromotion: "Passage de ligue",
  leaguePromotionCelebrationTitle: "Nouveau palier !",
  leaguePromotionCelebrationFirst: "Premier palier atteint",
  leaguePromotionCelebrationPerf: "{weight} kg × {reps}",
  newRecordCelebrationTitle: "Nouveau record !",
  levelUpCelebrationTitle: "Niveau supérieur !",
  levelUpCelebrationSubtitle: "Tu passes au niveau {level}",
  xpGainedToast: "+{amount} XP",
  xpLevelLabel: "Niveau {level}",
  xpProgressAria: "Progression vers le niveau suivant",
  xpProgressHint: "{current} / {total} XP vers le prochain niveau",
  xpBannerGoToProfile: "Voir mon profil",
  xpTotalLabel: "{xp} XP au total",
  progressCardTitle: "Progression",
  streakLabel: "Série active",
  streakDays: "{days} jours d'affilée",
  streakRuleHint: "2 jours off autorisés. Séance obligatoire au 3e jour.",
  streakSheetTitleFirstDay: "1 jour d'entraînement d'affilée",
  streakSheetSubtitleFirstDay:
    "Beau départ. Le week-end ne casse pas ta série si tu reviens au 3e jour.",
  streakSheetTitleStreak: "{days} jours d'entraînement d'affilée",
  streakSheetSubtitleStreak:
    "Tu peux t'accorder 2 jours sans séance (ex. week-end), puis revenir au 3e jour.",
  streakSheetLongest: "Record : {days} jours",
  streakXpBonusLabel: "+{percent}% XP",
  xpGainedBonusDescription: "+{bonus} bonus série · +{percent} %",
  profileActivityTitle: "Activité",
  profileActivityStreakCurrent: "Série en cours",
  profileActivityStreakLongest: "Meilleure série",
  profileActivityEmpty: "Aucune séance ce mois-ci.",
  profileActivityLess: "Repos",
  profileActivityMore: "Entraîné",
  profileActivityDaysInMonth: "{count} jours actifs",
  profileActivityPrevMonth: "Mois précédent",
  profileActivityNextMonth: "Mois suivant",
  xpSourcePerf: "Performance",
  xpSourcePr: "Record personnel",
  xpSourceLeague: "Promotion de ligue",
  xpSourceStreak: "Série quotidienne",
  share: "Partager",
  shareImageSaved: "Image enregistrée",
  shareImageError: "Impossible de créer ou partager l’image.",
  sharePreparing: "Préparation…",
  performanceList: "Liste des performances",
  noPerfForDay: "Aucune performance pour ce jour.",
  recordPerf: "Enregistrer une perf",
  newPerf: "Nouvelle performance",
  addSet: "Ajouter une série",
  restSinceLastSet: "Repos",
  restSinceLastSetA11y: "Repos depuis la dernière série : {time}",
  restSinceLastSetDismiss: "Masquer le repos",
  restTimeFinished: "Temps de repos terminé",
  restTimeFinishedA11y: "Temps de repos terminé, {time} écoulées",
  restTimeFinishedToastA11y: "Temps de repos terminé. Ouvrir {exercise}",
  restTimeSettingsTitle: "Temps de repos",
  restTimeSettingsDescription:
    "Durée cible entre deux séries. La barre se remplit sur cette durée, puis le compteur continue.",
  restTimeMinutes: "Minutes",
  restTimeSeconds: "Secondes",
  restTimeCurrent: "Durée actuelle : {time}",
  restTimeQuickEditLabel: "Temps de repos",
  restTimeQuickEditA11y: "Modifier le temps de repos, actuellement {time}",
  restTimeDecrease: "Diminuer de 15 secondes",
  restTimeIncrease: "Augmenter de 15 secondes",
  restCounterTourTitle: "Compteur de repos",
  restCounterTourContent:
    "Ce compteur démarre automatiquement quand tu enregistres une série. La barre se remplit jusqu'à ton temps de repos (1 min 30 par défaut).",
  restCounterTourQuickEditTitle: "Ajuste ton repos",
  restCounterTourQuickEditContent:
    "Appuie sur le chrono pour modifier la durée entre tes séries. Essaie plus ou moins, ou choisis un raccourci.",
  options: "Options",
  rename: "Renommer",
  renameExercise: "Renommer l'exercice",
  cancel: "Annuler",
  exerciseNotFound: "Exercice introuvable",
  back: "Retour",
  noExerciseInGroup: "Aucun exercice dans ce groupe musculaire.",
  noExerciseForBodyPart: "Aucun exercice pour cette partie du corps.",
  noExerciseFound: "Aucun exercice trouvé. Créez un exercice personnalisé.",
  page: "Page",
  apiErrorCustom:
    "Vous pouvez créer des exercices personnalisés avec le bouton « Personnalisé ».",
  confirmDelete: "Supprimer cet exercice de votre suivi ?",
  confirmDeletePerf: "Supprimer cette performance ?",
  modifyPerf: "Modifier",
  deletePerf: "Supprimer",
  placeholderExerciseName: "Ex: Développé militaire",
  searchExercise: "Rechercher un exercice...",
  browseChooseZone: "Choisir une zone du corps",
  browseChooseMuscle: "Choisir un muscle",
  browseChooseEquipment: "Choisir le matériel",
  browseChooseExercise: "Choisir l'exercice",
  browseViewAll: "Voir tout",
  browseViewByCategory: "Par catégorie",
  browseAllExercisesInZone: "Tous les exercices : {zone}",
  browseAllExercisesForMuscle: "Tous les exercices : {muscle}",
  browseExercisesCount: "{count} exercices",
  browseBreadcrumbZones: "Zones",
  browseBreadcrumbLabel: "Parcours de sélection",
  browseSearchResults: "Résultats de recherche",
  homeDoneToday: "Faits aujourd'hui",
  loading: "Chargement...",
  secondaryMuscles: "Muscles secondaires",
  instructions: "Instructions",

  // Paramètres / Profil
  settings: "Paramètres",
  appearance: "Apparence",
  theme: "Thème",
  themeDescription: "Choisis entre le thème système, clair ou sombre.",
  themeSystem: "Système",
  themeLight: "Clair",
  themeDark: "Sombre",
  profile: "Profil",
  profileDefaultName: "Athlète One More",
  profileEditName: "Modifier le nom",
  profileChangePhoto: "Changer la photo de profil",
  profileCropPhoto: "Recadrer la photo",
  profileCropZoom: "Zoom",
  profileFirstName: "Prénom",
  profileLastName: "Nom",
  profileNameSaved: "Nom enregistré",
  profileUsernameSaved: "Pseudo enregistré",
  profileUsernameSaveError: "Impossible d'enregistrer le pseudo",
  profileInviteButton: "Partager mon invitation",
  profileCopyInviteCode: "Copier mon code",
  profileShareButton: "Partager ma fiche",
  profileShareText: "Ma fiche One More",
  profileShareSuccess: "Fiche partagée",
  profileShareDownloaded: "Fiche téléchargée",
  profileShareError: "Impossible de partager la fiche",
  inviteCodeCopied: "Code copié",
  inviteCodeShared: "Code partagé",
  inviteShareError: "Impossible de partager le code",
  inviteShareTitle: "One More",
  inviteCodeShareMessage:
    "Rejoins-moi sur One More pour suivre ta muscu ensemble ! Utilise mon code de parrainage : {code}. On gagne des exos supplémentaires tous les deux.",
  inviteShareDialogTitle: "Inviter un pote",
  inviteCodeLabel: "Mon code de parrainage",
  /** @deprecated */
  inviteLinkCopied: "Code copié",
  /** @deprecated */
  inviteLinkShared: "Code partagé",
  exerciseLimitTitle: "Limite d'exercices atteinte",
  exerciseLimitDescription:
    "Tu suis {count}/{limit} exercices. Parraine un pote avec ton code pour gagner {bonus} exercices supplémentaires.",
  exerciseLimitInviteLink: "Partager mon invitation",
  exerciseLimitSearchFriend: "Voir mes amis",
  referralSettingsTitle: "Parrainage",
  referralSettingsDescription:
    "Utilise le code d'un pote pour gagner {bonus} exercices supplémentaires. Tu ne peux utiliser qu'un seul code.",
  referralYourCodeDescription:
    "Partage ton code unique : chaque pote qui l'utilise te rapporte {bonus} exercices.",
  referralCodeLabel: "Code de parrainage",
  referralYourCodeLabel: "Mon code à partager",
  referralCodePlaceholder: "ex. abc12def",
  signupReferralCodeTitle: "Tu as un code de parrainage ?",
  signupReferralCodeLabel: "Code de parrainage (optionnel)",
  signupReferralCodeHint: "Tu as le code d'un pote ? Gagne +{bonus} exercices.",
  profileReferralBannerTitle: "Gagne un t-shirt en édition limitée",
  profileReferralBannerSubtitle: "5 potes parrainés = t-shirt One More offert",
  referralCodeApply: "Appliquer le code",
  referralCodeApplied: "Code de parrainage appliqué",
  referralCodeAlreadyUsed: "Tu as déjà utilisé un code de parrainage",
  referralCodeInvalid: "Code de parrainage invalide",
  referralCodeSelf: "Tu ne peux pas utiliser ton propre code",
  referralStats:
    "Tu as parrainé {count} personne(s). Limite actuelle : {limit} exercices.",
  referralBonusPerInvite: "+{bonus} exercices pour toi et ton pote",
  referralTshirtEarned:
    "Bravo ! Tu as débloqué ton t-shirt One More grâce à tes parrainages.",
  referralTshirtProgress:
    "Encore {count} parrainage(s) pour débloquer ton t-shirt One More.",
  referralTshirtHint: "5 parrainages = t-shirt One More offert.",
  referralTshirtImageAlt: "T-shirt de récompense One More",
  referralTshirtSloganOutline: "ALWAYS",
  referralTshirtSloganBold: "ONE MORE",
  referralHubTitle: "Parrainage",
  referralHubDescription:
    "Partage ton code et débloque des exercices. +{bonus} si tu utilises le code d'un pote.",
  referralDrawerShortDescription:
    "Partage ton code : +{bonus} exercices pour toi et ton pote.",
  referralLimitHint:
    "Limite atteinte. Passe Premium pour des exercices illimités ou parraine un pote pour gagner +{bonus} exercices.",
  exerciseLimitPremiumTitle: "Exercices illimités",
  exerciseLimitPremiumDescription:
    "Passe Premium et suis autant d'exercices que tu veux, sans limite.",
  exerciseLimitPremiumButton: "Passer Premium",
  exerciseLimitOrDivider: "ou",
  exerciseLimitReferralTitle: "Parraine un pote",
  referralHubSettingsHint:
    "Ouvre le panneau parrainage pour partager ton code et suivre tes gains.",
  referralOpenDrawer: "Ouvrir le parrainage",
  settingsReferralInviteButton: "Je parraine",
  settingsReferralApplyButton: "J'ai un code de parrainage",
  referralApplyDrawerTitle: "Utiliser un code de parrainage",
  referralApplyDrawerDescription:
    "Entre le code d'un ami pour gagner +{bonus} exercices.",
  referralApplyCodeToggle: "J'ai reçu un code de parrainage",
  referralCountZero: "Aucun pote parrainé",
  referralCountOne: "1 pote parrainé",
  referralCountMany: "{count} potes parrainés",
  referralBattlePassTitle: "Gagne ton t-shirt en édition limitée",
  referralBattlePassRemaining: "Encore {count} parrainage(s) pour le t-shirt.",
  referralBattlePassReward: "T-shirt",
  referralBattlePassLegend:
    "Chaque pote parrainé = +{bonus} exercices · 5 potes = t-shirt offert",
  exerciseLimitViewReferral: "Voir mon parrainage",

  premiumSettingsTitle: "Abonnement Premium",
  premiumActiveDescription: "Tu bénéficies de l'abonnement premium One More.",
  premiumInactiveDescription:
    "Passe premium pour débloquer des avantages exclusifs One More.",
  premiumActiveBadge: "Abonnement premium actif",
  premiumSubscribeButton: "Passer Premium",
  premiumRestoreButton: "Restaurer mes achats",
  premiumSubscribeSuccess: "Abonnement activé",
  premiumSubscribeError: "Impossible de finaliser l'achat",
  premiumRestoreSuccess: "Achats restaurés",
  premiumRestoreError: "Impossible de restaurer les achats",

  tshirtClaimButton: "Réclamer mon t-shirt",
  tshirtClaimTitle: "Réclamer ton t-shirt One More",
  tshirtClaimDescription:
    "Renseigne ton adresse de livraison. Nous te contacterons si besoin.",
  tshirtClaimFullName: "Nom complet",
  tshirtClaimStreet: "Adresse",
  tshirtClaimCity: "Ville",
  tshirtClaimPostalCode: "Code postal",
  tshirtClaimCountry: "Pays",
  tshirtClaimSize: "Taille",
  tshirtClaimSubmit: "Envoyer ma demande",
  tshirtClaimSuccess: "Demande enregistrée. Ton t-shirt est en préparation.",
  tshirtClaimError: "Impossible d'enregistrer ta demande",
  tshirtClaimNotEligible: "Tu n'es pas encore éligible au t-shirt",
  tshirtClaimAlreadyDone: "Tu as déjà réclamé ton t-shirt",
  tshirtClaimPending: "Ton t-shirt est en cours de préparation.",
  tshirtClaimShipped: "Ton t-shirt a été expédié.",
  tshirtClaimShippedWithTracking:
    "Ton t-shirt a été expédié. Suivi : {tracking}",
  tshirtClaimDelivered: "Ton t-shirt a été livré. Profites-en !",
  tshirtDeliveryTrackingTitle: "Suivi de livraison",
  tshirtDeliveryStepPreparing: "Préparation",
  tshirtDeliveryStepShipping: "En livraison",
  tshirtDeliveryStepDelivered: "Livré",
  tshirtDeliveryTrackingLabel: "Suivi",

  friendsTitle: "Amis",
  friendsAddTitle: "Ajouter des amis",
  friendsListTitle: "Mes potes",
  friendRequestsTitle: "Demandes reçues",
  friendsEmpty:
    "Aucun pote pour l'instant. Invite quelqu'un depuis ton profil.",
  friendRequestPending: "Demande en attente",
  friendAccept: "Accepter",
  friendDecline: "Refuser",
  friendAccepted: "Pote ajouté",
  friendActionError: "Action impossible",
  friendRequestSent: "Demande d'ami envoyée",
  friendRequestOutgoing: "Demande envoyée",
  friendRequestsOutgoingTitle: "Demandes envoyées",
  friendCancelRequest: "Annuler la demande",
  friendAdd: "Ajouter",
  friendViewProfile: "Voir le profil",
  friendRemove: "Retirer",
  friendRemoveConfirm: "Retirer ce pote de ta liste ?",
  friendRemoved: "Pote retiré",
  friendTrainingNowBanner: "S'entraîne en ce moment",
  friendsTabList: "Amis",
  friendsTabSearch: "Rechercher",
  friendsTabMessages: "Messages",
  friendsSearchPlaceholder: "Prénom, nom ou @pseudo…",
  friendsSearchHint: "Recherche partielle : pas besoin du nom complet.",
  friendsSearchEmpty: "Tape un prénom, un nom ou un @pseudo pour chercher.",
  friendsSearchMinChars:
    "Saisis au moins 2 caractères (ou @ + 1 caractère pour un pseudo).",
  friendsSearchNoResults: "Aucun résultat.",
  friendsTrainingNow: "En ce moment",
  friendsTrainingGeneric: "En séance",
  messagesTitle: "Discussion",
  messagesEmpty:
    "Aucune conversation. Envoie un message à un pote depuis son profil.",
  messagesEmptyPreview: "Aucun message",
  messageInputPlaceholder: "Écrire un message…",
  messageSend: "Envoyer",
  messageOpenChat: "Message",
  socialSettingsTitle: "Social",
  socialSettingsDescription:
    "Pseudo et visibilité pour que tes potes puissent te trouver.",
  usernameLabel: "Pseudo",
  usernamePlaceholder: "mon_pseudo",
  usernameTitle: "Choisis ton pseudo",
  usernameHint:
    "3 à 20 caractères : lettres minuscules, chiffres et underscore. Visible par tes potes.",
  usernameInvalid: "Pseudo invalide",
  usernameTaken: "Ce pseudo est déjà pris",
  usernameAvailable: "Pseudo disponible",
  searchableByNameLabel: "Autoriser la recherche par prénom/nom",
  discoverableByUsernameLabel: "Pseudo visible à la recherche",
  profileLevelLabel: "Niveau",
  profileStreakLabel: "Série",
  friendProfileUnavailable: "Profil indisponible",
  inviteLandingTitle: "Invitation",
  inviteLandingHeading: "Tu es invité sur One More",
  inviteLandingBody: "{name} t'invite à suivre ta muscu ensemble.",
  inviteLandingCta: "Rejoindre One More",
  inviteNotFound: "Invitation introuvable ou expirée",
  inviteRequestSent: "Demande d'ami envoyée",
  profileShareRanked: "{count} exercices classés",
  profileGlobalLeague: "Ligue globale",
  profileRankedExercises: "Exercices classés",
  profileRecordsThisMonth: "Records ce mois",
  profileActiveDaysThisMonth: "Jours actifs",
  profileTopExercisesTitle: "Top exercices",
  profileSeeMore: "Voir plus ({count})",
  profileSeeLess: "Voir moins",
  profileRecentHistory: "Dernière séance",
  profileHistorySeeAll: "Tout voir",
  today: "Aujourd'hui",
  yesterday: "Hier",
  profileTopByLeague: "Meilleur palier",
  profileMostTrained: "Plus suivi",
  profilePerfCount: "{count} performances",
  profileNoTopLeague: "Aucun exercice classé",
  profileNoMostTrained: "Aucune perf enregistrée",
  profileLeagueDetailToggle: "Voir le détail des ligues",
  profileLeagueGaugeTitle: "Progression vers le palier suivant",
  profileMuscleMapTitle: "Carte musculaire",
  profileMuscleDetailTitle: "Détail par muscle",
  profileEmptyTitle: "Construis ta fiche",
  profileEmptyDescription:
    "Suis un exercice et enregistre des performances pour afficher ton niveau, tes ligues et tes tops.",
  profileEmptyLeagues:
    "Enregistre un record sur un exercice du catalogue pour débloquer les ligues.",
  profileLeagueHint:
    "Utilisé pour calculer ta ligue (ratio force / poids du corps).",
  bodyWeight: "Poids du corps (kg)",
  height: "Taille (cm)",
  gender: "Genre",
  male: "Homme",
  female: "Femme",

  // Compte
  account: "Compte",
  accountAndSync: "Compte",
  accountSyncDescription:
    "Connecte-toi pour associer tes données à ton compte et les retrouver depuis l’app.",
  backToSettings: "Retour",
  connectOrCreateAccount: "Connectez-vous ou créez un compte",
  createAccount: "Créer un compte",
  login: "Se connecter",
  email: "Email",
  firstNameTitle: "Quel est ton prénom ?",
  firstName: "Prénom",
  lastNameTitle: "Quel est ton nom de famille ?",
  lastName: "Nom",
  passwordTitle: "Crée ton mot de passe",
  password: "Mot de passe",
  confirmPassword: "Confirmer le mot de passe",
  passwordHint: "Minimum 8 caractères.",
  showPassword: "Afficher le mot de passe",
  hidePassword: "Masquer le mot de passe",
  passwordsDoNotMatch: "Les mots de passe ne correspondent pas.",
  switchToRegister: "Créer un compte",
  switchToLogin: "J'ai déjà un compte",
  continueWith: "Ou continuer avec",
  continueWithGoogle: "Continuer avec Google",
  continueWithApple: "Continuer avec Apple",
  oauthComingSoon: "Connexion via Google/Apple",
  connectedAs: "Connecté en tant que",
  notConnected: "Non connecté",
  signIn: "Se connecter",
  signOut: "Se déconnecter",
  deleteAccountLink: "Supprimer mon compte",
  deleteAccountConfirm:
    "Pour supprimer ton compte, tu vas ouvrir un email pré-rempli à notre équipe. Continuer ?",
  deleteAccountEmailSubject: "Demande de suppression de compte One More",
  deleteAccountEmailBody:
    "Bonjour,\n\nJe souhaite supprimer définitivement mon compte One More.\n\nEmail du compte : {email}\n\nMerci.",
  settingsBuildVersion: "Version",
  settingsBuildNumber: "Build",
  settingsBuildEnv: "Env",
  settingsBuildMode: "Mode",
  settingsBuildPlatform: "Plateforme",
  settingsBuildApi: "API",

  // Onboarding (premier lancement)
  onboardingTitle: "Prêt à progresser ?",
  onboardingDescription: "Pour ceux qui veulent faire une rep de plus.",
  onboardingBodyTitleGender: "Quel est ton genre ?",
  onboardingBodyTitleWeight: "Quel est ton poids de corps ?",
  onboardingBodyTitleHeight: "Quelle est ta taille ?",
  onboardingStepIndicator: "Étape {current} sur {total}",
  onboardingQuestionGenderHint: "Pour adapter les comparatifs et les ligues.",
  onboardingQuestionWeightHint: "Utilisé pour les paliers et ton classement.",
  onboardingQuestionHeightHint: "Ta taille complète le calcul de profil.",
  onboardingFirstExerciseTitle: "Ton premier exercice",
  onboardingFirstExerciseDescription:
    "Ajoute un exercice via le parcours guidé : commence par une zone, puis un muscle, puis le matériel, et termine par le choix de l’exercice.",
  onboardingFirstExerciseTourAddTitle: "Ajoute ce premier exercice",
  onboardingFirstExerciseTourAddContent:
    "Dans la liste finale, appuie sur Ajouter sur l’exercice voulu. Tu ouvres ensuite la saisie de ta première performance avant d’arriver sur sa fiche détaillée.",
  popularExercise: "Populaire",
  onboardingFirstExerciseSearch: "Rechercher…",
  onboardingSkipFirstExercise: "Passer pour l’instant",
  onboardingCreateAccountDescription:
    "Crée ton compte maintenant pour sauvegarder et envoyer les données de ton onboarding.",
  /** Tour guidé (react-joyride) sur la fiche après la première perf */
  exerciseOnboardingTourOverviewTitle: "Ta fiche exercice",
  exerciseOnboardingTourOverviewContent:
    "Ici tu vois le résumé du mouvement (dernier set, record, niveau estimé). Pour ajouter une performance depuis cette fiche, utilise le bouton Nouvelle performance.",
  exerciseOnboardingTourLeagueTitle: "Ligue",
  exerciseOnboardingTourLeagueContent:
    "Ton palier actuel et la cible pour passer au suivant (selon ton profil et l’exercice du catalogue).",
  exerciseOnboardingTourHistoryTitle: "Progression",
  exerciseOnboardingTourHistoryContent:
    "La courbe suit ton évolution dans le temps. Plus bas, tu retrouves les séries de la séance : tu peux en ajouter une nouvelle ou modifier/supprimer une entrée existante.",
  joyrideClose: "Fermer",
  joyrideLast: "Terminer",
  joyrideSkip: "Passer",
  joyrideNextWithProgress: "Suivant ({current} sur {total})",
  continue: "Continuer",
  next: "Suivant",
  later: "Plus tard",

  // Avis
  rateApp: "Laisser un avis",
  rateAppDescription:
    "Si l’app t’aide à progresser, une note sur le Store fait vraiment la différence.",
  rateNow: "Noter l’app",
  dontAskAgain: "Ne plus demander",

  // Ligues
  league: "Ligue",
  topPercentile: "Top {p}%",
  percentileDescription: "Plus fort que {p}% des pratiquants",
  nextLeague: "Palier suivant",
  reachToUpgrade: "Atteindre {weight} kg (1RM) pour passer",
  noLeague: "Exo non classé",
  your1RM: "Ton 1RM (Une répétition max)",
  tierRange: "Palier actuel",
  tierRangeValue: "{start} kg → {end} kg",
  tierRangeElite: "≥ {start} kg",
  remainingForNext: "Il te manque {kg} kg pour",
  allTiers: "Tous les paliers",

  // Carte musculaire (stats)
  bodyMapSilhouetteMale: "Silhouette masculine",
  bodyMapSilhouetteFemale: "Silhouette féminine",
  bodyMapLegendLow: "Fer",
  bodyMapLegendHigh: "Légende",
  bodyMapLeagueColorsCaption:
    "Chaque zone colorée = la couleur du palier moyen sur ce muscle (comme Fer, Or, Diamant…).",
  bodyMapFace: "Face",
  bodyMapBack: "Dos",
  bodyMapHint:
    "Touche un muscle coloré (face ou dos) pour ouvrir le détail. Touche à nouveau la même zone pour fermer, ou utilise la croix / Échap.",
  bodyMapZoneDetail: "Muscles de cette zone",
  /** Carte stats : modal après tap sur une zone */
  bodyMapZoneAverageTier: "Palier représentatif de la zone",
  /** Une seule cible muscle sur la zone SVG */
  bodyMapMuscleAverageTier: "Palier représentatif sur ce muscle",
  bodyMapMuscleExercisesHeading: "Exercices et paliers",
  bodyMapClearSelection: "Fermer le détail",

  /** Stats : pas de données ligue / carte */
  statsEmptyTitle: "Aucune statistique de ligue",
  statsEmptyDescription:
    "Enregistre au moins un record sur un exercice du catalogue (hors cardio). Les exercices personnalisés ne sont pas classés. Vérifie aussi ton profil pour le calcul des paliers.",

  /** Stats : jauge ligue globale */
  statsGlobalGaugeTitle: "Vers le palier suivant (moyenne)",
  statsGlobalGaugeCaption:
    "Ta moyenne combine palier + progression sur chaque exo. La jauge montre l’avancement entre deux paliers d’affilée (Fer → Bronze → …).",
  statsGlobalGaugeMax:
    "En moyenne tu es au palier Légende. Objectif maintenu ou records sur de nouveaux exos.",
  statsProfileInvalid: "Indique un poids et une taille valides.",
  statsProfileSaved: "Profil enregistré",
  /** Lien sous la modal profil ligues vers la page paramètres complète */
  statsFullSettingsLink: "Tous les paramètres",

  // Notifications
  notifications: "Notifications",
  notificationsDescription:
    "Chaque type peut être activé ou désactivé indépendamment.",
  notificationsEnablePush: "Autoriser les notifications push",
  notificationsNativeOnly:
    "Les notifications push sont disponibles sur l'app mobile.",
  notificationDefaultTitle: "One More",
  notifPrefStreak: "Rappels de série",
  notifPrefFriendRequests: "Demandes d'ami",
  notifPrefFriendAccepted: "Demandes acceptées",
  notifPrefMessages: "Messages",
  notifPrefFriendTraining: "Séances d'amis (cloche par profil)",
  notifPrefFriendRecords: "Records d'amis",
  notifPrefWeeklyRecap: "Récap hebdomadaire",
  notifPrefSaveError: "Impossible de sauvegarder les préférences",
  notifFriendTrainingBellOn: "Être notifié quand cet ami s'entraîne",
  notifFriendTrainingBellOff: "Ne plus être notifié pour les séances",
  notifFriendTrainingOn: "Tu seras notifié quand cet ami s'entraîne",
  notifFriendTrainingOff: "Notifications de séance désactivées",
  notifFriendTrainingMasterOff:
    "Active « Séances d'amis » dans Paramètres pour utiliser la cloche",
  streakGraceDayHint: "Dernier jour pour garder ta série",
  streakGraceDayAria: "Série de {days} jours, dernier jour de grâce",
};
