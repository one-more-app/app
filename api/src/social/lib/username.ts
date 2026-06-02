const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function assertValidUsername(username: string): void {
  if (!isValidUsername(username)) {
    throw new Error(
      'Le pseudo doit contenir 3 à 20 caractères (lettres minuscules, chiffres, underscore).',
    );
  }
}

/** Transforme un prénom, nom ou partie d'email en segment de pseudo valide. */
export function slugifyUsernamePart(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 12);
}

export function buildUsernameCandidates(params: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string[] {
  const first = slugifyUsernamePart(params.firstName ?? '');
  const last = slugifyUsernamePart(params.lastName ?? '');
  const emailLocal = params.email?.split('@')[0] ?? '';
  const fromEmail = slugifyUsernamePart(emailLocal);

  const raw: string[] = [];
  if (first && last) raw.push(`${first}_${last}`);
  if (first) raw.push(first);
  if (last) raw.push(last);
  if (fromEmail) raw.push(fromEmail);
  raw.push('athlete');

  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of raw) {
    const trimmed = candidate.slice(0, 20);
    if (trimmed.length < 3 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function suggestUsernameFromProfile(params: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  return buildUsernameCandidates(params)[0] ?? 'athlete';
}
