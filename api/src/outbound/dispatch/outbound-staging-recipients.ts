/**
 * Staging-only: force dispatch audience to fixed user IDs (comma-separated env).
 * Ignored when NODE_ENV=production even if the env var is set.
 */
export type OutboundStagingEnv = {
  NODE_ENV?: string;
  OUTBOUND_STAGING_RECIPIENT_IDS?: string;
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

export function isOutboundStagingRecipientOverrideActive(
  env: OutboundStagingEnv = process.env,
): boolean {
  if (env.NODE_ENV === 'production') return false;
  return (
    parseOutboundStagingRecipientIds(env.OUTBOUND_STAGING_RECIPIENT_IDS)
      .length > 0
  );
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
