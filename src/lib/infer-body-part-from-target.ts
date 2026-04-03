/**
 * Associe un muscle cible (ExerciseDB `target`) à une partie du corps (`bodyPart`).
 * Utilisé pour les filtres et les exercices personnalisés.
 */
const TARGET_TO_BODY_PART: Record<string, string> = {
  "upper back": "back",
  "lower back": "back",
  lats: "back",
  "latissimus dorsi": "back",
  traps: "back",
  trapezius: "back",
  rhomboids: "back",
  "levator scapulae": "back",

  chest: "chest",
  pectorals: "chest",
  "upper chest": "chest",
  "serratus anterior": "chest",

  shoulders: "shoulders",
  delts: "shoulders",
  deltoids: "shoulders",
  "rear deltoids": "shoulders",

  "upper arms": "upper arms",
  biceps: "upper arms",
  triceps: "upper arms",
  brachialis: "upper arms",
  "lower arms": "lower arms",
  forearms: "lower arms",
  "wrist flexors": "lower arms",
  "wrist extensors": "lower arms",
  "grip muscles": "lower arms",
  wrists: "lower arms",
  hands: "lower arms",

  abs: "waist",
  abdominals: "waist",
  core: "waist",
  obliques: "waist",
  "lower abs": "waist",

  "upper legs": "upper legs",
  glutes: "upper legs",
  hamstrings: "upper legs",
  quadriceps: "upper legs",
  quads: "upper legs",
  "hip flexors": "upper legs",
  groin: "upper legs",
  "inner thighs": "upper legs",
  adductors: "upper legs",
  abductors: "upper legs",
  "rotator cuff": "shoulders",

  calves: "lower legs",
  soleus: "lower legs",
  shins: "lower legs",
  ankles: "lower legs",
  "ankle stabilizers": "lower legs",
  feet: "lower legs",

  neck: "neck",
}

export function inferBodyPartFromTarget(target: string): string | undefined {
  return TARGET_TO_BODY_PART[target.toLowerCase()]
}
