export type PersonalBest = { weight: number; reps: number } | null;

/**
 * True only when an existing personal best is beaten.
 * The first performance on an exercise is a baseline, not a record.
 */
export function isNewPersonalBest(
  prevPB: PersonalBest,
  nextPB: PersonalBest,
): boolean {
  if (!nextPB || !prevPB) return false;
  return (
    nextPB.weight > prevPB.weight ||
    (nextPB.weight === prevPB.weight && nextPB.reps > prevPB.reps)
  );
}

export function getPersonalBestFromEntries(
  entries: { weight: number; reps: number }[],
): PersonalBest {
  if (entries.length === 0) return null;
  return entries.reduce((best, e) => {
    if (!best) return { weight: e.weight, reps: e.reps };
    if (e.weight > best.weight) return { weight: e.weight, reps: e.reps };
    if (e.weight === best.weight && e.reps > best.reps)
      return { weight: e.weight, reps: e.reps };
    return best;
  }, null as PersonalBest);
}
