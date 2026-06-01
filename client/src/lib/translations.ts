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
  return EQUIPMENT[en.toLowerCase()] ?? en;
}

// Libellés UI
export const UI = {
  addExercise: "Ajouter un exercice",
  chooseExercises: "Choisir des exercices",
  noTrackedExercises: "Aucun exercice suivi",
  noTrackedDescription:
    "Ajoutez des exercices pour commencer à suivre vos performances",
  muscleGroup: "Groupe musculaire",
  bodyPartLabel: "Partie du corps",
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
  leaguePromotionCelebrationPerf: "{weight} kg × {reps} reps",
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
  streakLabel: "Série de jours actifs",
  streakDays: "{days} jours d'affilée",
  streakSheetTitleFirstDay: "1 jour d'entraînement d'affilée",
  streakSheetSubtitleFirstDay:
    "Beau départ — reviens demain pour faire grandir ta série !",
  streakSheetTitleStreak: "{days} jours d'entraînement d'affilée",
  streakSheetSubtitleStreak: "Tu es régulier·le, garde ce rythme !",
  streakSheetLongest: "Record : {days} jours",
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
  profileFirstName: "Prénom",
  profileLastName: "Nom",
  profileNameSaved: "Nom enregistré",
  profileInviteButton: "Inviter un pote",
  profileInviteComingSoon:
    "Bientôt disponible — tu pourras envoyer ton profil à un ami pour le faire rejoindre l'app.",
  profileShareButton: "Partager ma fiche",
  profileShareText: "Ma fiche One More",
  profileShareRanked: "{count} exercices classés",
  profileGlobalLeague: "Ligue globale",
  profileRankedExercises: "Exercices classés",
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
    "Choisis un exercice, enregistre une première performance, puis découvre les repères de l’app.",
  onboardingFirstExerciseTourAddTitle: "Ajoute ce premier exercice",
  onboardingFirstExerciseTourAddContent:
    "Appuie sur Ajouter pour ouvrir la feuille, enregistrer ta première perf, puis accéder à la fiche détaillée.",
  popularExercise: "Populaire",
  onboardingFirstExerciseSearch: "Rechercher…",
  onboardingSkipFirstExercise: "Passer pour l’instant",
  onboardingCreateAccountDescription:
    "Crée ton compte maintenant pour sauvegarder et envoyer les données de ton onboarding.",
  /** Tour guidé (react-joyride) sur la fiche après la première perf */
  exerciseOnboardingTourOverviewTitle: "Ta fiche exercice",
  exerciseOnboardingTourOverviewContent:
    "Résumé du mouvement : dernier set, record, et bouton pour enregistrer une perf rapidement.",
  exerciseOnboardingTourLeagueTitle: "Ligue",
  exerciseOnboardingTourLeagueContent:
    "Ton palier actuel et la cible pour passer au suivant (selon ton profil et l’exercice du catalogue).",
  exerciseOnboardingTourHistoryTitle: "Progression",
  exerciseOnboardingTourHistoryContent:
    "La courbe suit ton poids dans le temps ; en dessous, les séries du jour avec ajout ou modification.",
  joyrideClose: "Fermer",
  joyrideLast: "Terminer",
  joyrideSkip: "Passer",
  joyrideNextWithProgress: "Suivant ({current} sur {total})",
  continue: "Continuer",
  celebrationQueueProgress: "{current} / {total}",
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
    "En moyenne tu es au palier Légende — objectif maintenu ou records sur de nouveaux exos.",
  statsProfileInvalid: "Indique un poids et une taille valides.",
  statsProfileSaved: "Profil enregistré",
  /** Lien sous la modal profil ligues vers la page paramètres complète */
  statsFullSettingsLink: "Tous les paramètres",
};
