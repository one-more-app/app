import type { PerformanceEntry } from "@/types";

/** Ordre chronologique : date croissante, puis createdAt croissant. */
export function chronologicalPerfOrder(
  a: PerformanceEntry,
  b: PerformanceEntry,
): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  const byCreated =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (byCreated !== 0) return byCreated;
  return a.id.localeCompare(b.id);
}

/** Dernière perf : date la plus récente, puis la plus récente ce jour-là. */
export function getLatestPerformanceEntry(
  entries: PerformanceEntry[],
): PerformanceEntry | undefined {
  if (entries.length === 0) return undefined;
  return [...entries].sort(chronologicalPerfOrder).at(-1);
}
