/** Jours sans séance tolérés entre deux entraînements (ex. week-end). */
export const STREAK_ALLOWED_REST_DAYS = 2;

/** Écart calendaire max entre deux séances pour continuer la série. */
export const STREAK_MAX_GAP_DAYS = STREAK_ALLOWED_REST_DAYS + 1;

/** Jours sans séance avant que la série affichée tombe à 0. */
export const STREAK_BREAK_AFTER_DAYS_WITHOUT = STREAK_MAX_GAP_DAYS + 1;

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

/** Série affichée : 0 si trop de jours sans séance depuis la dernière. */
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
  if (diffDays >= 1 && diffDays <= STREAK_MAX_GAP_DAYS) {
    return { current: currentStreak + 1 };
  }
  return { current: 1 };
}

/** Dernier jour pour sauver la série sans séance ce jour-là. */
export function isStreakOnGraceDay(
  lastActiveDate: string | null,
  currentStreak: number,
  today: string = todayDateKey(),
): boolean {
  return (
    currentStreak > 0 &&
    !!lastActiveDate &&
    daysWithoutActivitySince(lastActiveDate, today) === STREAK_MAX_GAP_DAYS
  );
}

/** Alias sémantique pour les rappels push. */
export function isStreakAtRisk(
  lastActiveDate: string | null,
  currentStreak: number,
  today: string = todayDateKey(),
): boolean {
  return isStreakOnGraceDay(lastActiveDate, currentStreak, today);
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
