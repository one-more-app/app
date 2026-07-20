/** Affichage TV : prénom + nom complet (contexte stand public). */
export function formatEventParticipantDisplayName(
  firstName: string,
  lastName: string,
): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!last) return first;
  return `${first} ${last}`;
}
