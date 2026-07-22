import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

jest.unstable_mockModule('../../analytics/analytics.service.js', () => ({
  AnalyticsService: class MockAnalyticsService {},
}));
jest.unstable_mockModule('../../rewards/rewards.service.js', () => ({
  RewardsService: class MockRewardsService {},
}));

const { BillingService } = await import('../billing.service.js');

describe('BillingService', () => {
  const usersRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const profilesRepo = {
    findOne: jest.fn(),
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
    config.get.mockImplementation((key: string) => {
      if (key === 'REVENUECAT_PREMIUM_ENTITLEMENT_ID') return 'premium';
      if (key === 'REVENUECAT_API_KEY') return 'rc-test-key';
      return undefined;
    });
    service = new BillingService(
      usersRepo as any,
      profilesRepo as any,
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
    expect(
      rewardsService.grantAnnualClassicPackIfMissing,
    ).not.toHaveBeenCalled();
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

  it('grants annual reward when syncing an active annual subscription', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            subscriber: {
              entitlements: {
                premium: {
                  expires_date: new Date(Date.now() + 86_400_000).toISOString(),
                  product_identifier: 'start_annual',
                },
              },
            },
          }),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await service.syncPremiumFromRevenueCat('user-1');

    expect(result).toEqual({ isPremium: true });
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { isPremium: true },
    );
    expect(rewardsService.grantAnnualClassicPackIfMissing).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('does not grant annual reward when syncing a monthly subscription', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            subscriber: {
              entitlements: {
                premium: {
                  expires_date: new Date(Date.now() + 86_400_000).toISOString(),
                  product_identifier: 'start_mensual',
                },
              },
            },
          }),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await service.syncPremiumFromRevenueCat('user-1');

    expect(result).toEqual({ isPremium: true });
    expect(
      rewardsService.grantAnnualClassicPackIfMissing,
    ).not.toHaveBeenCalled();
  });

  it('syncs subscriber attributes to RevenueCat', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      isPremium: false,
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      firstName: 'Alex',
      lastName: 'Martin',
      username: 'alexm',
      gender: 'male',
      weightKg: 80,
      heightCm: 180,
      afMediaSource: null,
      afCampaign: null,
      afAdset: null,
      afAdgroup: null,
      afKeywords: null,
      afSub1: null,
    });

    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await service.syncSubscriberAttributes('user-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.revenuecat.com/v1/subscribers/user-1/attributes',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer rc-test-key',
        }),
      }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as {
      attributes: Record<string, { value: string }>;
    };
    expect(body.attributes.$email).toEqual({ value: 'alex@example.com' });
    expect(body.attributes.$displayName).toEqual({ value: 'Alex Martin' });
  });
});
