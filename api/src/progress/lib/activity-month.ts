const MONTH_KEY_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function parseMonthKey(month: string): { year: number; month: number } {
  const m = MONTH_KEY_RE.exec(month);
  if (!m) {
    throw new Error('Invalid month key');
  }
  return { year: Number(m[1]), month: Number(m[2]) };
}

export function monthKeyFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

/**
 * Normalise une valeur DATE renvoyée par un raw SQL (string `YYYY-MM-DD`
 * ou `Date` selon le driver) en clé mois `YYYY-MM`.
 */
export function monthKeyFromSqlDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return monthKeyFromDate(value);
  }
  if (typeof value === 'string' && value.length >= 7) {
    return value.slice(0, 7);
  }
  return null;
}

/** Jour ISO `YYYY-MM-DD` depuis un raw SQL DATE. */
export function isoDayFromSqlDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }
  return null;
}

export function monthRangeBounds(monthKey: string): {
  start: string;
  end: string;
} {
  const { year, month } = parseMonthKey(monthKey);
  const start = `${monthKey}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return monthKeyFromDate(d);
}
