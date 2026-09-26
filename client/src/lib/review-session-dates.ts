import { getAllPerformanceEntries } from "@/lib/storage";

export function getDistinctSessionDateKeys(): string[] {
  const dates = new Set<string>();
  for (const entry of getAllPerformanceEntries()) {
    if (entry.deletedAt) continue;
    if (entry.date) dates.add(entry.date);
  }
  return [...dates].sort();
}

export function countCompletedSessionDaysBeforeToday(
  todayDateKey: string,
): number {
  return getDistinctSessionDateKeys().filter((d) => d < todayDateKey).length;
}
