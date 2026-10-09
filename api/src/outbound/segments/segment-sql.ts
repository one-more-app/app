/**
 * Séance / exo « réel » vs onboarding.
 * L’onboarding enregistre au plus 1 tracked_exercise + 1 performance_entry.
 * Pas de colonne `source` en base : on ignore ce premier couple.
 */
export const SQL_HAS_REAL_SESSION = `(
  (SELECT COUNT(*) FROM tracked_exercises te
    WHERE te."userId" = u.id AND te."deletedAt" IS NULL) > 1
  OR
  (SELECT COUNT(*) FROM performance_entries p
    WHERE p."userId" = u.id AND p."deletedAt" IS NULL) > 1
)`;

/** Dernière activité app : refresh de session, token push, ou perf. */
export const SQL_LAST_APP_ACTIVITY = `GREATEST(
  COALESCE((SELECT MAX(s."lastSeenAt") FROM sessions s WHERE s."userId" = u.id), u."createdAt"),
  COALESCE((SELECT MAX(dt."lastSeenAt") FROM device_tokens dt WHERE dt."userId" = u.id), u."createdAt"),
  COALESCE((
    SELECT MAX(p."updatedAt") FROM performance_entries p
    WHERE p."userId" = u.id AND p."deletedAt" IS NULL
  ), u."createdAt")
)`;
