/**
 * Base locale des exercices les plus populaires en salle.
 * Données issues de StrengthLog (analyse de millions de workouts).
 * Images: Wikimedia Commons (domaine public / CC) - bibliothèque gratuite.
 *
 * Format URL Wikimedia: https://upload.wikimedia.org/wikipedia/commons/<h>/<hh>/<file>
 * ou via redirect: https://commons.wikimedia.org/wiki/Special:FilePath/<file>
 */

export interface TopExercise {
  id: string;
  name: string;
  originalName?: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl: string;
}

/** Base URL pour les images Wikimedia Commons (redirect vers l'image réelle) */
const WIKI = "https://commons.wikimedia.org/wiki/Special:FilePath";

const EXERCISES: TopExercise[] = [
  {
    id: "1",
    name: "Développé couché barre",
    originalName: "barbell bench press",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "barbell",
    secondaryMuscles: ["deltoïdes antérieurs", "triceps"],
    instructions: [
      "Allongez-vous sur un banc plat, pieds au sol.",
      "Saisissez la barre légèrement plus large que les épaules.",
      "Descendez la barre jusqu’au milieu des pectoraux.",
      "Poussez jusqu’à l’extension complète des bras.",
    ],
    gifUrl: `${WIKI}/Coach_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "2",
    name: "Squat barre",
    originalName: "barbell squat",
    bodyPart: "upper legs",
    target: "quadriceps",
    equipment: "barbell",
    secondaryMuscles: ["fessiers", "ischio-jambiers", "gainage"],
    instructions: [
      "Placez la barre sur le haut du dos, pieds écartés largeur d’épaules.",
      "Gardez la poitrine haute, poussez les fesses en arrière et pliez les genoux.",
      "Descendez jusqu’à ce que les cuisses soient au moins parallèles au sol.",
      "Poussez sur les talons pour revenir debout.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "3",
    name: "Soulevé de terre barre",
    originalName: "barbell deadlift",
    bodyPart: "back",
    target: "erector spinae",
    equipment: "barbell",
    secondaryMuscles: ["ischio-jambiers", "fessiers", "trapèzes"],
    instructions: [
      "Pieds largeur de hanches, barre au-dessus du milieu du pied.",
      "Pivotez au niveau des hanches, saisissez la barre à l’extérieur des jambes.",
      "Poussez sur les talons, tendez hanches et genoux simultanément.",
      "Redescendez en contrôlant le mouvement.",
    ],
    gifUrl: `${WIKI}/Man_Lifting_Barbell_Deadlift_GIF_Animation_Loop.gif`,
  },
  {
    id: "4",
    name: "Développé épaules",
    originalName: "overhead press",
    bodyPart: "shoulders",
    target: "delts",
    equipment: "barbell",
    secondaryMuscles: ["triceps", "haut des pectoraux"],
    instructions: [
      "Debout, pieds largeur d’épaules, barre à hauteur des épaules.",
      "Poussez la barre au-dessus de la tête jusqu’à extension complète.",
      "Redescendez en contrôlant le mouvement.",
    ],
    gifUrl: `${WIKI}/Coach_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "5",
    name: "Rowing barre",
    originalName: "barbell row",
    bodyPart: "back",
    target: "lats",
    equipment: "barbell",
    secondaryMuscles: ["rhomboïdes", "biceps", "trapèzes"],
    instructions: [
      "Pencher le buste, barre suspendue bras tendus.",
      "Tirez la barre vers le bas du buste.",
      "Serrez les omoplates en haut du mouvement.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Onearmpullup.gif`,
  },
  {
    id: "6",
    name: "Tirage vertical",
    originalName: "lat pulldown",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    secondaryMuscles: ["biceps", "rhomboïdes"],
    instructions: [
      "Asseyez-vous à la poulie, prise plus large que les épaules.",
      "Tirez la barre jusqu’au haut des pectoraux.",
      "Serrez les dorsaux en bas, remontez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Pullup.gif`,
  },
  {
    id: "7",
    name: "Développé couché haltères",
    originalName: "dumbbell bench press",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "dumbbell",
    secondaryMuscles: ["deltoïdes antérieurs", "triceps"],
    instructions: [
      "Allongez-vous sur le banc, haltères à hauteur des épaules.",
      "Poussez les haltères vers le haut jusqu’à extension des bras.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Man_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "8",
    name: "Presse à cuisses",
    originalName: "leg press",
    bodyPart: "upper legs",
    target: "quadriceps",
    equipment: "machine",
    secondaryMuscles: ["fessiers", "ischio-jambiers"],
    instructions: [
      "Asseyez-vous, dos plaqué contre le support.",
      "Pieds largeur d’épaules sur la plateforme.",
      "Descendez jusqu’à 90° de flexion des genoux.",
      "Poussez sur les talons pour tendre les jambes.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "9",
    name: "Tractions pronation",
    originalName: "pull-up",
    bodyPart: "back",
    target: "lats",
    equipment: "body weight",
    secondaryMuscles: ["biceps", "gainage"],
    instructions: [
      "Accrochez-vous à la barre en pronation, bras tendus.",
      "Tirez jusqu’à ce que le menton dépasse la barre.",
      "Redescendez en contrôlant jusqu’à suspension complète.",
    ],
    gifUrl: `${WIKI}/Pullup.gif`,
  },
  {
    id: "10",
    name: "Pompes",
    originalName: "push-up",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "body weight",
    secondaryMuscles: ["triceps", "deltoïdes antérieurs", "gainage"],
    instructions: [
      "Position de gainage, mains légèrement plus larges que les épaules.",
      "Descendez la poitrine vers le sol, coudes à 45°.",
      "Poussez jusqu’à extension complète des bras.",
    ],
    gifUrl: `${WIKI}/Man_Doing_Push_Ups_GIF_Animation_Loop.gif`,
  },
  {
    id: "11",
    name: "Soulevé de terre roumain",
    originalName: "romanian deadlift",
    bodyPart: "upper legs",
    target: "hamstrings",
    equipment: "barbell",
    secondaryMuscles: ["fessiers", "bas du dos"],
    instructions: [
      "Debout, barre aux cuisses, genoux légèrement fléchis.",
      "Pivotez au niveau des hanches en les poussant en arrière.",
      "Descendez la barre le long des jambes jusqu’à sentir les ischio-jambiers.",
      "Poussez les hanches vers l’avant pour revenir debout.",
    ],
    gifUrl: `${WIKI}/Man_Lifting_Barbell_Deadlift_GIF_Animation_Loop.gif`,
  },
  {
    id: "12",
    name: "Élévation latérale haltères",
    originalName: "dumbbell lateral raise",
    bodyPart: "shoulders",
    target: "delts",
    equipment: "dumbbell",
    secondaryMuscles: ["trapèzes"],
    instructions: [
      "Debout, haltères le long du corps, paumes vers l’intérieur.",
      "Levez les bras sur les côtés jusqu’à l’horizontale.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Coach_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "13",
    name: "Curl barre",
    originalName: "barbell curl",
    bodyPart: "upper arms",
    target: "biceps",
    equipment: "barbell",
    secondaryMuscles: ["avant-bras"],
    instructions: [
      "Debout, barre bras tendus, paumes vers l’avant.",
      "Fléchissez pour amener la barre aux épaules.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Man_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "14",
    name: "Extension triceps poulie",
    originalName: "tricep pushdown",
    bodyPart: "upper arms",
    target: "triceps",
    equipment: "cable",
    secondaryMuscles: [],
    instructions: [
      "Debout à la poulie avec barre ou corde.",
      "Poussez vers le bas jusqu’à extension des bras.",
      "Remontez en contrôlant, coudes serrés.",
    ],
    gifUrl: `${WIKI}/Coach_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "15",
    name: "Développé incliné",
    originalName: "incline bench press",
    bodyPart: "chest",
    target: "upper chest",
    equipment: "barbell",
    secondaryMuscles: ["deltoïdes", "triceps"],
    instructions: [
      "Réglez le banc à 30-45° d’inclinaison.",
      "Descendez la barre vers le haut des pectoraux.",
      "Poussez jusqu’à extension complète.",
    ],
    gifUrl: `${WIKI}/Coach_Lifting_Dumbbells_GIF_Animation_Loop.gif`,
  },
  {
    id: "16",
    name: "Extension de jambes",
    originalName: "leg extension",
    bodyPart: "upper legs",
    target: "quadriceps",
    equipment: "machine",
    secondaryMuscles: [],
    instructions: [
      "Asseyez-vous, pieds sous le rouleau.",
      "Tendez les jambes pour verrouiller les genoux.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "17",
    name: "Rowing haltères",
    originalName: "dumbbell row",
    bodyPart: "back",
    target: "lats",
    equipment: "dumbbell",
    secondaryMuscles: ["biceps", "rhomboïdes"],
    instructions: [
      "Main et genou sur le banc pour le support.",
      "Tirez l’haltère vers la hanche, coude près du corps.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Onearmpullup.gif`,
  },
  {
    id: "18",
    name: "Tirage horizontal",
    originalName: "cable seated row",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    secondaryMuscles: ["biceps", "rhomboïdes"],
    instructions: [
      "Asseyez-vous, pieds sur la plateforme, genoux légèrement fléchis.",
      "Tirez la poignée vers le bas du buste.",
      "Serrez les omoplates, revenez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Onearmpullup.gif`,
  },
  {
    id: "19",
    name: "Leg curl",
    originalName: "leg curl",
    bodyPart: "upper legs",
    target: "hamstrings",
    equipment: "machine",
    secondaryMuscles: ["mollets"],
    instructions: [
      "Allongé ou assis, chevilles sous le rouleau.",
      "Fléchissez les jambes vers les fessiers.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Legraises.gif`,
  },
  {
    id: "20",
    name: "Hip thrust",
    originalName: "hip thrust",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "barbell",
    secondaryMuscles: ["ischio-jambiers", "gainage"],
    instructions: [
      "Dos haut sur le banc, barre sur les hanches.",
      "Poussez sur les talons pour tendre les hanches.",
      "Serrez les fessiers en haut, redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "21",
    name: "Gainage",
    originalName: "plank",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    secondaryMuscles: ["gainage", "épaules"],
    instructions: [
      "Appui sur avant-bras et pointes de pieds.",
      "Gardez le corps aligné de la tête aux talons.",
      "Maintenez le temps souhaité.",
    ],
    gifUrl: `${WIKI}/Man_Doing_Push_Ups_GIF_Animation_Loop.gif`,
  },
  {
    id: "22",
    name: "Crunch",
    originalName: "crunch",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    secondaryMuscles: [],
    instructions: [
      "Allongé sur le dos, genoux fléchis, pieds au sol.",
      "Enroulez les épaules vers les genoux.",
      "Redescendez en contrôlant.",
    ],
    gifUrl: `${WIKI}/Man_Doing_Sit_Ups_GIF_Animation_Loop.gif`,
  },
  {
    id: "23",
    name: "Mollets",
    originalName: "calf raise",
    bodyPart: "lower legs",
    target: "calves",
    equipment: "body weight",
    secondaryMuscles: [],
    instructions: [
      "Debout, orteils sur le bord d’une marche ou à plat.",
      "Montez sur la pointe des pieds le plus haut possible.",
      "Descendez les talons sous la position de départ pour l’étirement.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "24",
    name: "Dips",
    originalName: "dips",
    bodyPart: "upper arms",
    target: "triceps",
    equipment: "body weight",
    secondaryMuscles: ["pectoraux", "deltoïdes"],
    instructions: [
      "Appui sur les barres parallèles, bras tendus.",
      "Descendez jusqu’à ce que les bras soient parallèles au sol.",
      "Poussez jusqu’à extension complète.",
    ],
    gifUrl: `${WIKI}/Man_Doing_Push_Ups_GIF_Animation_Loop.gif`,
  },
  {
    id: "25",
    name: "Squat goblet",
    originalName: "goblet squat",
    bodyPart: "upper legs",
    target: "quadriceps",
    equipment: "kettlebell",
    secondaryMuscles: ["fessiers", "gainage"],
    instructions: [
      "Tenez le kettlebell ou haltère contre la poitrine.",
      "Descendez en squat, coudes à l’intérieur des genoux.",
      "Poussez sur les talons pour vous relever.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "26",
    name: "Fente",
    originalName: "lunge",
    bodyPart: "upper legs",
    target: "quadriceps",
    equipment: "body weight",
    secondaryMuscles: ["fessiers", "ischio-jambiers"],
    instructions: [
      "Faites un grand pas vers l’avant en fente.",
      "Le genou arrière descend vers le sol.",
      "Poussez pour revenir ou alternez les jambes.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "27",
    name: "Burpee",
    originalName: "burpee",
    bodyPart: "cardio",
    target: "full body",
    equipment: "body weight",
    secondaryMuscles: [],
    instructions: [
      "Depuis la position debout, descendez en position de pompe.",
      "Faites une pompe.",
      "Sautez pour ramener les pieds aux mains, puis sautez en l’air.",
    ],
    gifUrl: `${WIKI}/Burpees.gif`,
  },
  {
    id: "28",
    name: "Jumping jack",
    originalName: "jumping jack",
    bodyPart: "cardio",
    target: "full body",
    equipment: "body weight",
    secondaryMuscles: [],
    instructions: [
      "Debout, pieds joints, bras le long du corps.",
      "Sautez en écartant les jambes et levant les bras.",
      "Revenez à la position de départ.",
    ],
    gifUrl: `${WIKI}/Jumpingjacks.gif`,
  },
  {
    id: "29",
    name: "Mountain climber",
    originalName: "mountain climber",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    secondaryMuscles: ["fléchisseurs de hanche", "épaules"],
    instructions: [
      "Commencez en position de gainage.",
      "Amenez les genoux alternativement vers la poitrine.",
      "Gardez les hanches basses et le gainage engagé.",
    ],
    gifUrl: `${WIKI}/Squats.gif`,
  },
  {
    id: "30",
    name: "Relevé de jambes",
    originalName: "leg raise",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    secondaryMuscles: ["fléchisseurs de hanche"],
    instructions: [
      "Allongé sur le dos, jambes tendues.",
      "Levez les jambes à la verticale.",
      "Redescendez en contrôlant sans toucher le sol.",
    ],
    gifUrl: `${WIKI}/Legraises.gif`,
  },
];

/** Tous les exercices populaires */
export function getTopExercises(): TopExercise[] {
  return [...EXERCISES];
}

/** Récupérer par ID */
export function getTopExerciseById(id: string): TopExercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** Recherche par nom ou body part */
export function searchTopExercises(
  query: string,
  bodyPart?: string,
): TopExercise[] {
  const q = query.trim().toLowerCase();
  const bp = bodyPart?.toLowerCase();

  return EXERCISES.filter((e) => {
    const orig = (e.originalName ?? e.name).toLowerCase();
    const nameMatch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      orig.includes(q) ||
      e.target.toLowerCase().includes(q);
    const bodyMatch =
      !bp || bp === "all" || e.bodyPart.toLowerCase().includes(bp);
    return nameMatch && bodyMatch;
  });
}
