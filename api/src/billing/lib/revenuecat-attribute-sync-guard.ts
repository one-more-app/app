import type { RevenueCatAttributePayload } from './revenuecat-subscriber-attributes.js';

export const DEFAULT_ATTRIBUTE_SYNC_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const ATTRIBUTE_SYNC_RATE_LIMIT_BACKOFF_MS = 15 * 60 * 1000;

export type AttributeSyncSkipReason =
  | 'rate_limit_backoff'
  | 'ttl'
  | 'fingerprint';

type UserAttributeSyncState = {
  lastFingerprint: string;
  lastSentAt: number;
  rateLimitedUntil: number;
};

const stateByUserId = new Map<string, UserAttributeSyncState>();

export function fingerprintRevenueCatAttributes(
  attributes: RevenueCatAttributePayload,
): string {
  const keys = Object.keys(attributes).sort();
  const normalized: Record<string, string | null> = {};
  for (const key of keys) {
    normalized[key] = attributes[key]?.value ?? null;
  }
  return JSON.stringify(normalized);
}

export function shouldSkipAttributeSync(params: {
  userId: string;
  fingerprint: string;
  minIntervalMs: number;
  now?: number;
}): AttributeSyncSkipReason | null {
  const now = params.now ?? Date.now();
  const existing = stateByUserId.get(params.userId);

  if (existing && now < existing.rateLimitedUntil) {
    return 'rate_limit_backoff';
  }

  if (!existing) return null;

  if (existing.lastFingerprint === params.fingerprint) {
    return 'fingerprint';
  }

  if (now - existing.lastSentAt < params.minIntervalMs) {
    return 'ttl';
  }

  return null;
}

export function recordAttributeSyncSuccess(params: {
  userId: string;
  fingerprint: string;
  now?: number;
}): void {
  const now = params.now ?? Date.now();
  stateByUserId.set(params.userId, {
    lastFingerprint: params.fingerprint,
    lastSentAt: now,
    rateLimitedUntil: 0,
  });
}

export function recordAttributeSyncRateLimited(params: {
  userId: string;
  now?: number;
}): void {
  const now = params.now ?? Date.now();
  const existing = stateByUserId.get(params.userId);
  stateByUserId.set(params.userId, {
    lastFingerprint: existing?.lastFingerprint ?? '',
    lastSentAt: existing?.lastSentAt ?? 0,
    rateLimitedUntil: now + ATTRIBUTE_SYNC_RATE_LIMIT_BACKOFF_MS,
  });
}

/** Tests only — reset in-memory guard state. */
export function resetAttributeSyncGuardState(): void {
  stateByUserId.clear();
}
