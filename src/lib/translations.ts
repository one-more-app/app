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
  "upper back": "Haut du dos",
  "lower back": "Bas du dos",
  lats: "Dorsaux",
  chest: "Poitrine",
  "serratus anterior": "Dentelé antérieur",
  pectorals: "Pectoraux",
  shoulders: "Épaules",
  "upper arms": "Bras",
  "lower arms": "Avant-bras",
  abs: "Abdominaux",
  "upper legs": "Cuisses",
  "lower legs": "Jambes",
  glutes: "Fessiers",
  hamstrings: "Ischio-jambiers",
  quadriceps: "Quadriceps",
  calves: "Mollets",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  traps: "Trapèzes",
  neck: "Cou",
  cardio: "Cardio",
};

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
};

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
  all: "Tous",
  custom: "Personnalisé",
  newCustomExercise: "Nouvel exercice personnalisé",
  name: "Nom",
  category: "Catégorie",
  filterByBodyPart: "Filtrer par partie du corps",
  filterByEquipment: "Filtrer par matériel",
  add: "Ajouter",
  added: "Ajouté",
  last: "Dernier",
  record: "Record",
  reps: "Reps",
  weight: "Poids",
  addedWeight: "Lest additionnel (kg)",
  weightPerDumbbell: "Poids par haltère (kg)",
  totalLoadHint: "Charge totale (corps + lest)",
  dumbbellWeightHint: "Poids d'un seul haltère",
  bodyWeightOnly: "Poids du corps",
  bodyWeightAbbr: "PDC",
  save: "Enregistrer",
  delete: "Supprimer",
  history: "Historique",
  recordPerf: "Enregistrer une perf",
  newPerf: "Nouvelle performance",
  options: "Options",
  rename: "Renommer",
  renameExercise: "Renommer l'exercice",
  cancel: "Annuler",
  exerciseNotFound: "Exercice introuvable",
  back: "Retour",
  noExerciseInGroup: "Aucun exercice dans ce groupe musculaire.",
  noExerciseFound: "Aucun exercice trouvé. Créez un exercice personnalisé.",
  page: "Page",
  apiErrorCustom:
    "Vous pouvez créer des exercices personnalisés avec le bouton « Personnalisé ».",
  confirmDelete: "Supprimer cet exercice de votre suivi ?",
  placeholderExerciseName: "Ex: Développé militaire",
  searchExercise: "Rechercher un exercice...",
  loading: "Chargement...",
  secondaryMuscles: "Muscles secondaires",
  instructions: "Instructions",

  // Paramètres / Profil
  settings: "Paramètres",
  profile: "Profil",
  bodyWeight: "Poids du corps (kg)",
  height: "Taille (cm)",
  gender: "Genre",
  male: "Homme",
  female: "Femme",

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
};
