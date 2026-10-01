/** Nombre d’IDs présents dans les deux listes (amis en commun). */
export function countMutualFriendIds(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let n = 0;
  for (const id of a) {
    if (setB.has(id)) n += 1;
  }
  return n;
}
