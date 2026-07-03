import { describe, expect, it } from '@jest/globals';
import { toOpenPanelRevenueCents } from '../analytics.service.js';

describe('toOpenPanelRevenueCents', () => {
  it('converts euros to centimes', () => {
    expect(toOpenPanelRevenueCents(9.99)).toBe(999);
    expect(toOpenPanelRevenueCents(59.99)).toBe(5999);
  });

  it('rounds half-up to avoid float drift', () => {
    expect(toOpenPanelRevenueCents(10.005)).toBe(1001);
  });
});
