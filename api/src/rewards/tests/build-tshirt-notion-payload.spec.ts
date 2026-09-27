import { describe, expect, it } from '@jest/globals';
import { TshirtRewardType } from '../entities/tshirt-reward-type.enum.js';
import { buildTshirtNotionPayload } from '../lib/build-tshirt-notion-payload.js';

describe('buildTshirtNotionPayload', () => {
  const baseClaim = {
    id: 'claim-1',
    userId: 'user-1',
    rewardType: TshirtRewardType.ReferralLimited,
    status: 'pending',
    size: 'M',
    gender: null,
    fullName: 'Jean Dupont',
    street: '1 rue Test',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    trackingNumber: null,
    claimedAt: new Date('2026-03-15T10:00:00.000Z'),
    shippedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('maps referral claim with email', () => {
    const payload = buildTshirtNotionPayload(
      'db-id',
      baseClaim,
      'jean@example.com',
    );

    expect(payload.parent).toEqual({ database_id: 'db-id' });
    expect(payload.properties.Nom).toEqual({
      title: [{ text: { content: 'Jean Dupont' } }],
    });
    expect(payload.properties.Type).toEqual({
      select: { name: 'Parrainage' },
    });
    expect(payload.properties.Statut).toEqual({
      status: { name: 'À traiter' },
    });
    expect(payload.properties.Email).toEqual({ email: 'jean@example.com' });
    expect(payload.properties['Réclamé le']).toEqual({
      date: { start: '2026-03-15' },
    });
  });

  it('maps annual pack without email property when missing', () => {
    const payload = buildTshirtNotionPayload(
      'db-id',
      {
        ...baseClaim,
        rewardType: TshirtRewardType.AnnualClassicPack,
      },
      null,
    );

    expect(payload.properties.Type).toEqual({
      select: { name: 'Pack annuel' },
    });
    expect(payload.properties.Email).toBeUndefined();
  });
});
