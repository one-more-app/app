import {
  compareMonthKeys,
  getCurrentMonthKey,
} from "@/lib/activity-calendar";
import { getLocalDateKey } from "@/lib/local-date";
import type { PerformanceEntry } from "@/types";
import {
  applyStreakExpiry,
  computeStreakFromActivityDates,
} from "@one-more/shared/streak-dates";

export type ProfileActivityView = {
  month: string;
  activeDays: string[];
  activeDayCount: number;
  streak: { current: number; longest: number };
  bounds: { earliestMonth: string; latestMonth: string };
};

/** Jour d'activité canonique d'une perf (champ `date` ou jour local de `createdAt`). */
export function getActivityDayKey(entry: PerformanceEntry): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return entry.date;
  }
  return getLocalDateKey(new Date(entry.createdAt));
}

export function mergePerformanceEntriesById(
  remote: PerformanceEntry[],
  local: PerformanceEntry[],
): PerformanceEntry[] {
  const byId = new Map<string, PerformanceEntry>();
  for (const entry of remote) {
    byId.set(entry.id, entry);
  }
  for (const entry of local) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }
  return [...byId.values()];
}

export function collectActiveDayKeysFromEntries(
  entries: PerformanceEntry[],
): string[] {
  const days = new Set<string>();
  for (const entry of entries) {
    if (entry.deletedAt) continue;
    days.add(getActivityDayKey(entry));
  }
  return [...days].sort();
}

export function collectActiveDayKeysInMonth(
  entries: PerformanceEntry[],
  monthKey: string,
): string[] {
  return collectActiveDayKeysFromEntries(entries).filter((day) =>
    day.startsWith(`${monthKey}-`),
  );
}

export function mergeActiveDayKeys(
  serverDays: string[],
  localDays: string[],
): string[] {
  return [...new Set([...serverDays, ...localDays])].sort();
}

export function getActivityMonthBounds(
  entries: PerformanceEntry[],
): { earliestMonth: string; latestMonth: string } {
  const latestMonth = getCurrentMonthKey();
  let earliestMonth = latestMonth;
  for (const entry of entries) {
    if (entry.deletedAt) continue;
    const monthKey = getActivityDayKey(entry).slice(0, 7);
    if (compareMonthKeys(monthKey, earliestMonth) < 0) {
      earliestMonth = monthKey;
    }
  }
  return { earliestMonth, latestMonth };
}

/** Calendrier + séries dérivés des perfs locales/API et de la progression. */
export function buildProfileActivityView(
  month: string,
  entries: PerformanceEntry[],
  progress?: {
    streak: { current: number; longest: number };
    lastActiveDate?: string | null;
  } | null,
): ProfileActivityView {
  const activeDays = collectActiveDayKeysInMonth(entries, month);
  const fromEntries = computeStreakFromActivityDates(
    collectActiveDayKeysFromEntries(entries),
  );
  const fromProgress = applyStreakExpiry(
    progress?.lastActiveDate ?? null,
    progress?.streak.current ?? 0,
  );

  return {
    month,
    activeDays,
    activeDayCount: activeDays.length,
    streak: {
      current: Math.max(fromProgress, fromEntries.current),
      longest: Math.max(progress?.streak.longest ?? 0, fromEntries.longest),
    },
    bounds: getActivityMonthBounds(entries),
  };
}

export { computeStreakFromActivityDates };
