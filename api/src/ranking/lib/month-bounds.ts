const YEAR_MONTH_RE = /^(\d{4})-(\d{2})$/;

export function parseYearMonth(month: string): {
  year: number;
  monthIndex: number;
} {
  const m = YEAR_MONTH_RE.exec(month);
  if (!m) {
    throw new Error('Invalid month');
  }
  const year = Number(m[1]);
  const monthIndex = Number(m[2]);
  if (monthIndex < 1 || monthIndex > 12) {
    throw new Error('Invalid month');
  }
  return { year, monthIndex };
}

function formatUtcDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const mo = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

export function monthActivityDateBounds(month: string): {
  start: string;
  end: string;
} {
  const { year, monthIndex } = parseYearMonth(month);
  const start = formatUtcDate(year, monthIndex, 1);
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const end = formatUtcDate(year, monthIndex, lastDay);
  return { start, end };
}
