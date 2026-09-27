const listeners = new Set<(open: boolean) => void>();
let perfDrawerOpen = false;

export function setReviewPerfDrawerOpen(open: boolean): void {
  if (perfDrawerOpen === open) return;
  perfDrawerOpen = open;
  for (const l of listeners) l(open);
}

export function isReviewPerfDrawerOpen(): boolean {
  return perfDrawerOpen;
}

export function subscribeReviewPerfDrawerOpen(
  listener: (open: boolean) => void,
): () => void {
  listeners.add(listener);
  listener(perfDrawerOpen);
  return () => listeners.delete(listener);
}
