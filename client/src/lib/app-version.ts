// client/src/lib/app-version.ts
export function normalizeVersionString(raw: string): string {
  return String(raw ?? "").trim().replace(/^[vV]/, "");
}

export function parseMarketingVersion(
  raw: string,
): [number, number, number] | null {
  const normalized = normalizeVersionString(raw);
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(normalized);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isBelowMinVersion(current: string, min: string): boolean {
  const a = parseMarketingVersion(current);
  const b = parseMarketingVersion(min);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}
