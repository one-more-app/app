/** Jours sans séance avant perte de la série en cours. */
export const STREAK_BREAK_AFTER_DAYS_WITHOUT = 2;

/** Différence en jours calendaires entre deux clés `YYYY-MM-DD` (sans fuseau). */
export function calendarDaysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
}

export function todayDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Jours calendaires écoulés depuis la dernière séance (0 le jour même). */
export function daysWithoutActivitySince(
  lastActiveDate: string | null,
  today: string = todayDateKey(),
): number {
  if (!lastActiveDate) return 0;
  return Math.max(0, calendarDaysBetween(lastActiveDate, today));
}

/** Série affichée : 0 si 2 jours ou plus sans séance depuis la dernière. */
export function applyStreakExpiry(
  lastActiveDate: string | null,
  currentStreak: number,
  today: string = todayDateKey(),
): number {
  if (currentStreak <= 0 || !lastActiveDate) return 0;
  if (
    daysWithoutActivitySince(lastActiveDate, today) >=
    STREAK_BREAK_AFTER_DAYS_WITHOUT
  ) {
    return 0;
  }
  return currentStreak;
}

export function computeStreakAfterActivity(
  lastActiveDate: string | null,
  currentStreak: number,
  activityDate: string,
): { current: number } {
  if (!lastActiveDate) return { current: 1 };
  const diffDays = calendarDaysBetween(lastActiveDate, activityDate);
  if (diffDays === 0) return { current: currentStreak };
  if (diffDays === 1) return { current: currentStreak + 1 };
  if (diffDays === 2) return { current: currentStreak + 1 };
  return { current: 1 };
}

export function computeStreakFromActivityDates(
  dates: string[],
  today: string = todayDateKey(),
): {
  current: number;
  longest: number;
} {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  let longest = 0;
  let lastActive: string | null = null;

  for (const day of sorted) {
    const after = computeStreakAfterActivity(lastActive, current, day);
    current = after.current;
    longest = Math.max(longest, current);
    lastActive = day;
  }

  current = applyStreakExpiry(lastActive, current, today);

  return { current, longest };
}
