import { getActivityDayKey, collectActiveDayKeysInMonth } from "@/lib/activity-from-performances";
import { chronologicalPerfOrder } from "@/lib/performance-order";
import type { PerformanceEntry } from "@/types";
import {
  getPersonalBestFromEntries,
  isNewPersonalBest,
} from "@one-more/shared/personal-best";

function isInMonth(dayKey: string, monthKey: string): boolean {
  return dayKey.startsWith(`${monthKey}-`);
}

/** Nombre de performances qui ont battu le record personnel sur le mois. */
export function countPersonalRecordsInMonth(
  entries: PerformanceEntry[],
  monthKey: string,
): number {
  const active = entries.filter((e) => !e.deletedAt);
  const byTracked = new Map<string, PerformanceEntry[]>();

  for (const entry of active) {
    const list = byTracked.get(entry.trackedExerciseId) ?? [];
    list.push(entry);
    byTracked.set(entry.trackedExerciseId, list);
  }

  let count = 0;
  for (const list of byTracked.values()) {
    list.sort(chronologicalPerfOrder);
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      if (!isInMonth(getActivityDayKey(entry), monthKey)) continue;

      const before = list.slice(0, i);
      const prevPB = getPersonalBestFromEntries(
        before.map((e) => ({ weight: e.weight, reps: e.reps })),
      );
      if (
        isNewPersonalBest(prevPB, {
          weight: entry.weight,
          reps: entry.reps,
        })
      ) {
        count++;
      }
    }
  }

  return count;
}

/** Jours distincts avec au moins une séance sur le mois. */
export function countActiveDaysInMonth(
  entries: PerformanceEntry[],
  monthKey: string,
): number {
  return collectActiveDayKeysInMonth(
    entries.filter((e) => !e.deletedAt),
    monthKey,
  ).length;
}
