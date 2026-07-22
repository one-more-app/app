import {
  buildRevenueCatSubscriberAttributes,
  resolveRevenueCatDisplayName,
} from '../lib/revenuecat-subscriber-attributes.js';

describe('resolveRevenueCatDisplayName', () => {
  it('concatène prénom et nom', () => {
    expect(
      resolveRevenueCatDisplayName({ firstName: 'Alex', lastName: 'Martin' }),
    ).toBe('Alex Martin');
  });

  it('retourne null sans nom', () => {
    expect(resolveRevenueCatDisplayName({})).toBeNull();
  });
});

describe('buildRevenueCatSubscriberAttributes', () => {
  it('mappe email, nom et attributs profil', () => {
    const attributes = buildRevenueCatSubscriberAttributes({
      userId: 'user-1',
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'Martin',
      username: 'alexm',
      gender: 'male',
      weightKg: 80,
      heightCm: 180,
      isPremium: true,
      mediaSource: 'organic',
      campaign: 'launch',
      adset: 'set-a',
      adgroup: 'group-a',
      keywords: 'fitness',
      sub1: 'invite',
    });

    expect(attributes.$email).toEqual({ value: 'alex@example.com' });
    expect(attributes.$displayName).toEqual({ value: 'Alex Martin' });
    expect(attributes.first_name).toEqual({ value: 'Alex' });
    expect(attributes.last_name).toEqual({ value: 'Martin' });
    expect(attributes.username).toEqual({ value: 'alexm' });
    expect(attributes.gender).toEqual({ value: 'male' });
    expect(attributes.weight_kg).toEqual({ value: '80' });
    expect(attributes.height_cm).toEqual({ value: '180' });
    expect(attributes.is_premium).toEqual({ value: 'true' });
    expect(attributes.user_id).toEqual({ value: 'user-1' });
    expect(attributes.$mediaSource).toEqual({ value: 'organic' });
    expect(attributes.$campaign).toEqual({ value: 'launch' });
    expect(attributes.adset).toEqual({ value: 'set-a' });
    expect(attributes.$adGroup).toEqual({ value: 'group-a' });
    expect(attributes.$keyword).toEqual({ value: 'fitness' });
    expect(attributes.af_sub1).toEqual({ value: 'invite' });
  });
});
