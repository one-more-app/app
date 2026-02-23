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
  performanceList: "Liste des performances",
  noPerfForDay: "Aucune performance pour ce jour.",
  recordPerf: "Enregistrer une perf",
  newPerf: "Nouvelle performance",
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
