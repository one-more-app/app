/**
 * Staging-only: force dispatch audience to fixed user IDs (comma-separated env).
 * Ignored when NODE_ENV=production even if the env var is set.
 */
export type OutboundStagingEnv = {
  NODE_ENV?: string;
  OUTBOUND_STAGING_RECIPIENT_IDS?: string;
  /** Required when NODE_ENV=production (typical on staging hosts) to enable the allowlist. */
  OUTBOUND_STAGING_RECIPIENT_OVERRIDE?: string;
};

export function parseOutboundStagingRecipientIds(
  raw: string | undefined,
): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((id) => id.length > 0);
}

function stagingOverrideExplicitlyEnabled(env: OutboundStagingEnv): boolean {
  return env.OUTBOUND_STAGING_RECIPIENT_OVERRIDE?.trim() === 'true';
}

export function isOutboundStagingRecipientOverrideActive(
  env: OutboundStagingEnv = process.env,
): boolean {
  const ids = parseOutboundStagingRecipientIds(
    env.OUTBOUND_STAGING_RECIPIENT_IDS,
  );
  if (ids.length === 0) return false;
  if (env.NODE_ENV === 'production') {
    return stagingOverrideExplicitlyEnabled(env);
  }
  return true;
}

/** Set IDs but override blocked (e.g. production NODE_ENV without opt-in). */
export function isOutboundStagingRecipientOverrideConfiguredButInactive(
  env: OutboundStagingEnv = process.env,
): boolean {
  const ids = parseOutboundStagingRecipientIds(
    env.OUTBOUND_STAGING_RECIPIENT_IDS,
  );
  return ids.length > 0 && !isOutboundStagingRecipientOverrideActive(env);
}

/** Replaces segment audience with staging allowlist when active (force mode). */
export function resolveDispatchRecipientIds(
  segmentUserIds: string[],
  env: OutboundStagingEnv = process.env,
): string[] {
  if (!isOutboundStagingRecipientOverrideActive(env)) {
    return segmentUserIds;
  }
  return parseOutboundStagingRecipientIds(env.OUTBOUND_STAGING_RECIPIENT_IDS);
}
