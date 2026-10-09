export function parseSegmentDaysParam(
  value: unknown,
  fallback: number,
  label: string,
): number {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return Number.parseInt(trimmed, 10);
  }
  throw new Error(`${label}: param days invalide`);
}

function parseNonNegInt(
  value: unknown,
  fallback: number,
  label: string,
  field: string,
): number {
  if (value === undefined || value === null) {
    return fallback;
  }
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    n = Number.parseInt(trimmed, 10);
  } else {
    throw new Error(`${label}: param ${field} invalide`);
  }
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`${label}: param ${field} invalide`);
  }
  return n;
}

export type SegmentDelay = {
  days: number;
  hours: number;
  totalHours: number;
  maxTotalHours: number | null;
};

/** Min `days`/`hours` obligatoire. `maxDays`/`maxHours` optionnel (fenêtre exclusive). */
export function parseSegmentDelayParams(
  params: Record<string, unknown>,
  label: string,
): SegmentDelay {
  const days = parseNonNegInt(params.days, 0, label, 'days');
  const hours = parseNonNegInt(params.hours, 0, label, 'hours');
  const totalHours = days * 24 + hours;
  if (totalHours < 1) {
    throw new Error(`${label}: fournir days et/ou hours (≥ 1 h au total)`);
  }
  const maxDays = parseNonNegInt(params.maxDays, 0, label, 'maxDays');
  const maxHours = parseNonNegInt(params.maxHours, 0, label, 'maxHours');
  const maxTotalHours = maxDays * 24 + maxHours;
  if (maxTotalHours > 0 && maxTotalHours <= totalHours) {
    throw new Error(
      `${label}: maxDays/maxHours doit être strictement plus grand que days/hours`,
    );
  }
  return {
    days,
    hours,
    totalHours,
    maxTotalHours: maxTotalHours > 0 ? maxTotalHours : null,
  };
}
