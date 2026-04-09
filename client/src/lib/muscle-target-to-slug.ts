import type { Slug } from "react-muscle-highlighter";

/**
 * Associe les `target` normalisés (ExerciseDB / inferTargetForLeague)
 * aux slugs de `react-muscle-highlighter`.
 */
const TARGET_TO_SLUG: Readonly<Record<string, Slug>> = {
  delts: "deltoids",
  shoulders: "deltoids",
  deltoids: "deltoids",
  pectorals: "chest",
  chest: "chest",
  "serratus anterior": "chest",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  forearm: "forearm",
  abs: "abs",
  abdominals: "abs",
  obliques: "obliques",
  quads: "quadriceps",
  quadriceps: "quadriceps",
  adductors: "adductors",
  adductor: "adductors",
  calves: "calves",
  traps: "trapezius",
  trapezius: "trapezius",
  "upper back": "upper-back",
  "lower back": "lower-back",
  lats: "upper-back",
  spine: "lower-back",
  glutes: "gluteal",
  gluteal: "gluteal",
  hamstrings: "hamstring",
  hamstring: "hamstring",
  wrists: "forearm",
  hands: "hands",
  abductors: "abductors",
  tibialis: "tibialis",
};

export function muscleTargetToSlug(target: string): Slug | null {
  const k = target.toLowerCase().trim();
  return TARGET_TO_SLUG[k] ?? null;
}
