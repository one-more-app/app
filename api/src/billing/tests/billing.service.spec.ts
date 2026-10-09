import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

jest.unstable_mockModule('../../analytics/analytics.service.js', () => ({
  AnalyticsService: class MockAnalyticsService {},
}));
jest.unstable_mockModule('../../rewards/rewards.service.js', () => ({
  RewardsService: class MockRewardsService {},
}));

const { resetAttributeSyncGuardState } =
  await import('../lib/revenuecat-attribute-sync-guard.js');
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
    resetAttributeSyncGuardState();
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
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', isPremium: false });
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

  it('tracks Play Store monthly when entitlement is One More Pro', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'REVENUECAT_PREMIUM_ENTITLEMENT_ID') return 'One More Pro';
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
    usersRepo.findOne.mockResolvedValue({
      id: '9dd173e1-b902-42dd-a484-ae767f49ad1c',
      isPremium: false,
    });
    await service.handleRevenueCatWebhook({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: '9dd173e1-b902-42dd-a484-ae767f49ad1c',
        entitlement_ids: ['One More Pro'],
        product_id: 'starter_mensual_v2:mensual',
        price: 3.35,
        price_in_purchased_currency: 2.99,
        currency: 'EUR',
        period_type: 'NORMAL',
        transaction_id: 'GPA.3320-4354-0464-86136',
      },
    });
    expect(analytics.trackValidatedPurchase).toHaveBeenCalledWith({
      profileId: '9dd173e1-b902-42dd-a484-ae767f49ad1c',
      amount: 2.99,
      currency: 'EUR',
      productId: 'starter_mensual_v2:mensual',
      properties: {
        event_type: 'INITIAL_PURCHASE',
        period_type: 'NORMAL',
        transaction_id: 'GPA.3320-4354-0464-86136',
      },
    });
  });

  it('does not track revenue when entitlement id env does not match RC', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', isPremium: false });
    await service.handleRevenueCatWebhook({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        entitlement_ids: ['One More Pro'],
        product_id: 'starter_mensual_v2:mensual',
        price_in_purchased_currency: 2.99,
        currency: 'EUR',
      },
    });
    expect(usersRepo.update).not.toHaveBeenCalled();
    expect(analytics.trackValidatedPurchase).not.toHaveBeenCalled();
  });

  it('webhook does not sync RevenueCat attributes', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', isPremium: false });
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await service.handleRevenueCatWebhook({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        entitlement_ids: ['premium'],
        product_id: 'monthly',
        price_in_purchased_currency: 9.99,
        currency: 'EUR',
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('grants annual reward on annual purchase', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', isPremium: false });
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
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', isPremium: true });
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
    usersRepo.findOne.mockResolvedValue({ isPremium: false });

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

  it('skips DB update when syncPremium finds unchanged premium status', async () => {
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
    usersRepo.findOne.mockResolvedValue({ isPremium: true });

    const result = await service.syncPremiumFromRevenueCat('user-1');

    expect(result).toEqual({ isPremium: true });
    expect(usersRepo.update).not.toHaveBeenCalled();
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
    usersRepo.findOne.mockResolvedValue({ isPremium: false });

    const result = await service.syncPremiumFromRevenueCat('user-1');

    expect(result).toEqual({ isPremium: true });
    expect(
      rewardsService.grantAnnualClassicPackIfMissing,
    ).not.toHaveBeenCalled();
  });

  it('grants promotional monthly premium entitlement', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', isPremium: false });
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(''),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await service.grantPromotionalPremium('user-1');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.revenuecat.com/v1/subscribers/user-1/entitlements/premium/promotional',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ duration: 'monthly' }),
      }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { isPremium: true },
    );
  });

  it('returns ok:false when RC promotional grant fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('boom'),
      }),
    ) as unknown as typeof fetch;

    const result = await service.grantPromotionalPremium('user-1');
    expect(result).toEqual({ ok: false, error: 'RC 500' });
    expect(usersRepo.update).not.toHaveBeenCalled();
  });

  it('returns ok:false when API key missing for promotional grant', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'REVENUECAT_PREMIUM_ENTITLEMENT_ID') return 'premium';
      return undefined;
    });

    const result = await service.grantPromotionalPremium('user-1');
    expect(result).toEqual({
      ok: false,
      error: 'REVENUECAT_API_KEY missing',
    });
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

  it('skips duplicate attribute sync within ttl when fingerprint unchanged', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      isPremium: false,
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      firstName: 'Alex',
      lastName: null,
      username: null,
      gender: null,
      weightKg: null,
      heightCm: null,
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
    await service.syncSubscriberAttributes('user-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
