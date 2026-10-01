import { estimate1RM } from "./strength-standards.js";

export type OneRmSourceEntry = {
  weight: number;
  reps: number;
  date: string;
};

export type BestEstimatedOneRm = {
  oneRM: number;
  sourceWeight: number;
  sourceReps: number;
  sourceDate: string;
};

export type BestEstimatedOneRmOptions = {
  bodyWeightKg?: number | null;
  isBodyweightAdditive?: boolean;
};

/**
 * Estimated 1RM for a single set, matching league bodyweight rules when applicable.
 * Bodyweight without a valid BW falls back to plain estimate1RM(weight, reps).
 */
export function estimatedOneRmForSet(
  weight: number,
  reps: number,
  options: BestEstimatedOneRmOptions = {},
): number {
  if (reps <= 0) return 0;

  const isBodyweight = options.isBodyweightAdditive === true;
  const bodyWeightKg = options.bodyWeightKg ?? 0;

  if (isBodyweight && bodyWeightKg > 0) {
    const totalLoad = bodyWeightKg + weight;
    if (totalLoad <= 0) return 0;
    const totalOneRM = estimate1RM(totalLoad, reps);
    return Math.max(0, Math.round((totalOneRM - bodyWeightKg) * 10) / 10);
  }

  return estimate1RM(weight, reps);
}

function isBetterSource(
  candidate: BestEstimatedOneRm,
  current: BestEstimatedOneRm,
): boolean {
  if (candidate.oneRM !== current.oneRM) {
    return candidate.oneRM > current.oneRM;
  }
  if (candidate.sourceReps !== current.sourceReps) {
    return candidate.sourceReps > current.sourceReps;
  }
  return candidate.sourceDate > current.sourceDate;
}

/**
 * Best estimated 1RM across entries, with the source set that produced it.
 * Returns null when no entry yields a positive 1RM.
 */
export function bestEstimatedOneRmFromEntries(
  entries: OneRmSourceEntry[],
  options: BestEstimatedOneRmOptions = {},
): BestEstimatedOneRm | null {
  let best: BestEstimatedOneRm | null = null;

  for (const entry of entries) {
    const oneRM = estimatedOneRmForSet(entry.weight, entry.reps, options);
    if (oneRM <= 0) continue;

    const candidate: BestEstimatedOneRm = {
      oneRM,
      sourceWeight: entry.weight,
      sourceReps: entry.reps,
      sourceDate: entry.date,
    };

    if (!best || isBetterSource(candidate, best)) {
      best = candidate;
    }
  }

  return best;
}
