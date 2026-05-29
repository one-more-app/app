export type PersonalBest = { weight: number; reps: number } | null;

export function isNewPersonalBest(
  prevPB: PersonalBest,
  nextPB: PersonalBest,
): boolean {
  if (!nextPB) return false;
  if (!prevPB) return true;
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
