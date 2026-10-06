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
