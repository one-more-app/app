const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isValidRankingMonth(value: string | null | undefined): value is string {
  return !!value && MONTH_RE.test(value);
}

export function formatRankingMonth(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** Mois courant `YYYY-MM` (fuseau local de l'appareil). */
export function getCurrentRankingMonth(now = new Date()): string {
  return formatRankingMonth(now.getFullYear(), now.getMonth());
}

export function shiftRankingMonth(month: string, delta: number): string {
  const match = MONTH_RE.exec(month);
  if (!match) return month;
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1);
  return formatRankingMonth(date.getFullYear(), date.getMonth());
}

/** Libellé FR, ex. « septembre 2026 ». */
export function formatRankingMonthLabel(month: string): string {
  const match = MONTH_RE.exec(month);
  if (!match) return month;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}
