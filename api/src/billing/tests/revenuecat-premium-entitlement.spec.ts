import { describe, expect, it } from '@jest/globals';
import { revenueCatEventHasPremiumEntitlement } from '../lib/revenuecat-premium-entitlement.js';

describe('revenueCatEventHasPremiumEntitlement', () => {
  it('matches entitlement_ids case-insensitively', () => {
    expect(
      revenueCatEventHasPremiumEntitlement(
        { entitlement_ids: ['One More Pro'] },
        'one more pro',
      ),
    ).toBe(true);
  });

  it('matches entitlement_id when array is absent', () => {
    expect(
      revenueCatEventHasPremiumEntitlement(
        { entitlement_id: 'One More Pro' },
        'One More Pro',
      ),
    ).toBe(true);
  });

  it('returns false when configured id does not match', () => {
    expect(
      revenueCatEventHasPremiumEntitlement(
        { entitlement_ids: ['One More Pro'] },
        'premium',
      ),
    ).toBe(false);
  });
});
