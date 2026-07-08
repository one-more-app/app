import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

await jest.unstable_mockModule('../../analytics/analytics.service.js', () => ({
  AnalyticsService: class MockAnalyticsService {},
}));
await jest.unstable_mockModule('../../rewards/rewards.service.js', () => ({
  RewardsService: class MockRewardsService {},
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
  const rewardsService = {
    grantAnnualClassicPackIfMissing: jest.fn(),
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
      rewardsService as any,
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
        price: 10.99,
        price_in_purchased_currency: 9.99,
        currency: 'EUR',
      },
    });
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { isPremium: true },
    );
    expect(analytics.trackValidatedPurchase).toHaveBeenCalledWith({
      profileId: 'user-1',
      amount: 9.99,
      currency: 'EUR',
      productId: 'monthly',
      properties: { event_type: 'INITIAL_PURCHASE' },
    });
    expect(rewardsService.grantAnnualClassicPackIfMissing).not.toHaveBeenCalled();
  });

  it('grants annual reward on annual purchase', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1' });
    await service.handleRevenueCatWebhook({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        entitlement_ids: ['premium'],
        product_id: 'premium_annual',
      },
    });
    expect(rewardsService.grantAnnualClassicPackIfMissing).toHaveBeenCalledWith(
      'user-1',
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
