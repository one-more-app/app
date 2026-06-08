export function localDateKey(timezone: string, date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}

export function localHour(timezone: string, date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }).format(date);
  return Number.parseInt(hour, 10);
}

export function localWeekKey(timezone: string, date = new Date()): string {
  const dateKey = localDateKey(timezone, date);
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isEveningWindow(
  timezone: string,
  startHour = 18,
  endHour = 20,
  date = new Date(),
): boolean {
  const hour = localHour(timezone, date);
  return hour >= startHour && hour < endHour;
}

export function isSundayEvening(timezone: string, date = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return weekday === 'Sun' && isEveningWindow(timezone, 18, 20, date);
}
