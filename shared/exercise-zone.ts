/** Associe un muscle cible (ExerciseDB `target`) à une zone (`bodyPart`). */
const TARGET_TO_BODY_PART: Record<string, string> = {
  "upper back": "back",
  "lower back": "back",
  lats: "back",
  traps: "back",
  chest: "chest",
  pectorals: "chest",
  shoulders: "shoulders",
  delts: "shoulders",
  "upper arms": "upper arms",
  biceps: "upper arms",
  triceps: "upper arms",
  "lower arms": "lower arms",
  forearms: "lower arms",
  abs: "waist",
  abdominals: "waist",
  "upper legs": "upper legs",
  glutes: "upper legs",
  hamstrings: "upper legs",
  quads: "upper legs",
  quadriceps: "upper legs",
  calves: "lower legs",
};

export function inferBodyPartFromTarget(target: string): string | undefined {
  return TARGET_TO_BODY_PART[target.toLowerCase().trim()];
}

export type ZoneExerciseInput = {
  bodyPart?: string | null;
  target?: string | null;
};

export function exerciseZone(ex: ZoneExerciseInput): string | null {
  const target = ex.target?.toLowerCase();
  const inferred = target ? inferBodyPartFromTarget(target) : undefined;
  const bp = ex.bodyPart?.toLowerCase();
  return inferred ?? bp ?? null;
}
