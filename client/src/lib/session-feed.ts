import { formatTimeOnly } from "@/lib/history-entries";
import { formatHomeDayTitle } from "@/lib/home-day";
import type { DaySessionSummary } from "@/lib/session-api";
import type { PerformanceEntry } from "@/types";

export type SessionFeedItem = DaySessionSummary & {
  title: string;
};

/** Jours distincts des perfs actives, plus récents d'abord. */
export function collectDayKeysFromEntries(
  entries: PerformanceEntry[],
): string[] {
  const keys = new Set<string>();
  for (const entry of entries) {
    if (entry.deletedAt) continue;
    keys.add(entry.date);
  }
  return [...keys].sort((a, b) => b.localeCompare(a));
}

/**
 * Aplatit les séances de plusieurs jours, tri `startedAt` desc.
 * Titre : plus récente du jour → `formatHomeDayTitle` ; sinon heure.
 * (Même convention que `HomeDaySessions`.)
 */
export function buildSessionFeedItems(
  days: { dayKey: string; items: DaySessionSummary[] }[],
): SessionFeedItem[] {
  const flat: DaySessionSummary[] = [];
  for (const { items } of days) {
    for (const item of items) flat.push(item);
  }

  flat.sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  const newestIdByDay = new Map<string, string>();
  for (const item of flat) {
    if (!newestIdByDay.has(item.date)) {
      newestIdByDay.set(item.date, item.id);
    }
  }

  return flat.map((item) => ({
    ...item,
    title:
      newestIdByDay.get(item.date) === item.id
        ? formatHomeDayTitle(item.date)
        : formatTimeOnly(item.startedAt),
  }));
}
