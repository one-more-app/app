/** Différence en jours calendaires entre deux clés `YYYY-MM-DD` (sans fuseau). */
export function calendarDaysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
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
  return { current: 1 };
}
