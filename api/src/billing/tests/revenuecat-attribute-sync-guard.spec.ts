import { afterEach, describe, expect, it } from '@jest/globals';
import {
  DEFAULT_ATTRIBUTE_SYNC_MIN_INTERVAL_MS,
  fingerprintRevenueCatAttributes,
  recordAttributeSyncRateLimited,
  recordAttributeSyncSuccess,
  resetAttributeSyncGuardState,
  shouldSkipAttributeSync,
} from '../lib/revenuecat-attribute-sync-guard.js';

describe('revenuecat-attribute-sync-guard', () => {
  afterEach(() => {
    resetAttributeSyncGuardState();
  });

  it('fingerprints attributes with stable key order', () => {
    const a = fingerprintRevenueCatAttributes({
      b: { value: '2' },
      a: { value: '1' },
    });
    const b = fingerprintRevenueCatAttributes({
      a: { value: '1' },
      b: { value: '2' },
    });
    expect(a).toBe(b);
  });

  it('skips when fingerprint unchanged', () => {
    const fp = fingerprintRevenueCatAttributes({ x: { value: '1' } });
    recordAttributeSyncSuccess({ userId: 'u1', fingerprint: fp, now: 1000 });
    expect(
      shouldSkipAttributeSync({
        userId: 'u1',
        fingerprint: fp,
        minIntervalMs: DEFAULT_ATTRIBUTE_SYNC_MIN_INTERVAL_MS,
        now: 2000,
      }),
    ).toBe('fingerprint');
  });

  it('skips within ttl when fingerprint changed', () => {
    recordAttributeSyncSuccess({
      userId: 'u1',
      fingerprint: 'old',
      now: 1000,
    });
    expect(
      shouldSkipAttributeSync({
        userId: 'u1',
        fingerprint: 'new',
        minIntervalMs: 10_000,
        now: 5000,
      }),
    ).toBe('ttl');
  });

  it('skips during rate limit backoff', () => {
    recordAttributeSyncRateLimited({ userId: 'u1', now: 1000 });
    expect(
      shouldSkipAttributeSync({
        userId: 'u1',
        fingerprint: 'new',
        minIntervalMs: 0,
        now: 2000,
      }),
    ).toBe('rate_limit_backoff');
  });
});
