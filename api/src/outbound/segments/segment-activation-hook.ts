/** Filtre optionnel sur les leviers d’activation (rappel séance / arrivée salle). */

export const ACTIVATION_HOOK_VALUES = [
  'training_reminder',
  'not_training_reminder',
  'gym_arrival',
  'any',
  'both',
  'none',
] as const;

export type ActivationHookFilter = (typeof ACTIVATION_HOOK_VALUES)[number];

/**
 * Rappel séance actif : même base que le cron training reminder (sans matcher l’heure du jour).
 * - streakReminders ON
 * - au moins un jour de rappel (reminderSlots ou legacy reminderWeekdays)
 */
export const SQL_HAS_TRAINING_REMINDER = `
EXISTS (
  SELECT 1
  FROM notification_preferences p
  WHERE p."userId" = u.id
    AND p."streakReminders" = true
    AND (
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p."reminderSlots", '[]'::jsonb)) AS slot
        WHERE (slot->>'weekday') ~ '^[1-7]$'
      )
      OR COALESCE(array_length(p."reminderWeekdays", 1), 0) > 0
    )
)`;

/**
 * Arrivée salle : salle enregistrée + géofence activée + push enregistré (token device).
 */
export const SQL_HAS_GYM_ARRIVAL_NOTIFY = `
(
  EXISTS (
    SELECT 1
    FROM user_gyms g
    WHERE g."userId" = u.id
      AND btrim(g."placeId") <> ''
      AND g."geofenceEnabled" = true
  )
  AND EXISTS (SELECT 1 FROM device_tokens dt WHERE dt."userId" = u.id)
)`;

export function parseActivationHookFilter(
  params: Record<string, unknown>,
  label: string,
): ActivationHookFilter | null {
  const raw = params.activationHook ?? params.activation_hook;
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') {
    throw new Error(`${label}: activationHook invalide (attendu: string)`);
  }
  const normalized = raw.trim();
  if (normalized === '') return null;
  if (!(ACTIVATION_HOOK_VALUES as readonly string[]).includes(normalized)) {
    throw new Error(
      `${label}: activationHook invalide (attendu: ${ACTIVATION_HOOK_VALUES.join(', ')})`,
    );
  }
  return normalized as ActivationHookFilter;
}

export function sqlActivationHookPredicate(
  filter: ActivationHookFilter,
): string {
  switch (filter) {
    case 'training_reminder':
      return SQL_HAS_TRAINING_REMINDER;
    case 'not_training_reminder':
      return `NOT (${SQL_HAS_TRAINING_REMINDER})`;
    case 'gym_arrival':
      return SQL_HAS_GYM_ARRIVAL_NOTIFY;
    case 'any':
      return `(${SQL_HAS_TRAINING_REMINDER} OR ${SQL_HAS_GYM_ARRIVAL_NOTIFY})`;
    case 'both':
      return `(${SQL_HAS_TRAINING_REMINDER} AND ${SQL_HAS_GYM_ARRIVAL_NOTIFY})`;
    case 'none':
      return `NOT (${SQL_HAS_TRAINING_REMINDER} OR ${SQL_HAS_GYM_ARRIVAL_NOTIFY})`;
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}
