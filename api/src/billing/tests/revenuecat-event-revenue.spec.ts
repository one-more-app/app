import { describe, expect, it } from '@jest/globals';
import { extractRevenueFromRevenueCatEvent } from '../lib/revenuecat-event-revenue.js';

describe('extractRevenueFromRevenueCatEvent', () => {
  it('prefers price_in_purchased_currency over USD price', () => {
    expect(
      extractRevenueFromRevenueCatEvent({
        price: 29.99,
        price_in_purchased_currency: 9.99,
        currency: 'EUR',
      }),
    ).toEqual({ amount: 9.99, currency: 'EUR' });
  });

  it('defaults currency to EUR when missing', () => {
    expect(
      extractRevenueFromRevenueCatEvent({
        price_in_purchased_currency: 4.99,
      }),
    ).toEqual({ amount: 4.99, currency: 'EUR' });
  });

  it('falls back to USD price when purchased currency price is absent', () => {
    expect(
      extractRevenueFromRevenueCatEvent({
        price: 4.99,
        currency: 'USD',
      }),
    ).toEqual({ amount: 4.99, currency: 'USD' });
  });

  it('returns null when no price is available', () => {
    expect(extractRevenueFromRevenueCatEvent({ currency: 'EUR' })).toBeNull();
  });
});
