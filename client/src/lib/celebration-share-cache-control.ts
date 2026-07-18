/**
 * Invalidation légère du cache share : no-op tant que le module
 * `celebration-share-prewarm` (html-to-image) n’a pas été chargé.
 * Évite de tirer le chunk lourd à la fermeture de la modale.
 */

let invalidateFn: (() => void) | null = null;

export function registerCelebrationShareCacheInvalidator(
  fn: () => void,
): void {
  invalidateFn = fn;
}

/** Invalide le cache seulement s’il est déjà en mémoire. */
export function invalidateCelebrationShareCacheIfLoaded(): void {
  invalidateFn?.();
}
