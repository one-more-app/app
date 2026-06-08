export function formatUserDisplayName(profile: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string {
  const full = [profile.firstName, profile.lastName]
    .filter((v) => v && v.trim().length > 0)
    .join(' ')
    .trim();
  if (full) return full;
  if (profile.username) return `@${profile.username}`;
  return 'Un ami';
}
