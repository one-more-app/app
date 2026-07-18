import {
  getPersonalBestFromEntries,
  isNewPersonalBest,
} from '../../progress/lib/personal-best.js';

export type PersonalRecordEntry = {
  trackedExerciseId: string;
  date: string;
  weight: number;
  reps: number;
  updatedAt: Date;
  id: string;
};

function chronologicalPerfOrder(
  a: PersonalRecordEntry,
  b: PersonalRecordEntry,
): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  const byUpdated = a.updatedAt.getTime() - b.updatedAt.getTime();
  if (byUpdated !== 0) return byUpdated;
  return a.id.localeCompare(b.id);
}

/** Nombre total de performances qui ont battu le record personnel. */
export function countPersonalRecords(entries: PersonalRecordEntry[]): number {
  const byTracked = new Map<string, PersonalRecordEntry[]>();

  for (const entry of entries) {
    const list = byTracked.get(entry.trackedExerciseId) ?? [];
    list.push(entry);
    byTracked.set(entry.trackedExerciseId, list);
  }

  let count = 0;
  for (const list of byTracked.values()) {
    list.sort(chronologicalPerfOrder);
    const soFar: { weight: number; reps: number }[] = [];
    for (const entry of list) {
      const next = { weight: entry.weight, reps: entry.reps };
      if (isNewPersonalBest(getPersonalBestFromEntries(soFar), next)) {
        count++;
      }
      soFar.push(next);
    }
  }

  return count;
}
