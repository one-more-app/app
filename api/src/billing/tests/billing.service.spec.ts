import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

await jest.unstable_mockModule('../../analytics/analytics.service.js', () => ({
  AnalyticsService: class MockAnalyticsService {},
}));

const { BillingService } = await import('../billing.service.js');

describe('BillingService', () => {
  const usersRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const analytics = {
    trackValidatedPurchase: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'REVENUECAT_PREMIUM_ENTITLEMENT_ID') return 'premium';
      return undefined;
    }),
  };

  let service: InstanceType<typeof BillingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BillingService(
      usersRepo as any,
      config as unknown as ConfigService,
      analytics as any,
    );
  });

  it('sets premium on INITIAL_PURCHASE with entitlement', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1' });
    await service.handleRevenueCatWebhook({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        entitlement_ids: ['premium'],
        product_id: 'monthly',
        price: 9.99,
        currency: 'EUR',
      },
    });
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { isPremium: true },
    );
  });

  it('clears premium on EXPIRATION', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1' });
    await service.handleRevenueCatWebhook({
      event: {
        type: 'EXPIRATION',
        app_user_id: 'user-1',
      },
    });
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { isPremium: false },
    );
  });

  it('ignores unknown users', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await service.handleRevenueCatWebhook({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'missing',
        entitlement_ids: ['premium'],
      },
    });
    expect(usersRepo.update).not.toHaveBeenCalled();
  });
});
