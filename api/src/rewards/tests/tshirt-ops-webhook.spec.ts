import { describe, expect, it } from '@jest/globals';
import {
  buildTshirtOpsWebhookPayload,
  isDiscordWebhookUrl,
} from '../lib/tshirt-ops-webhook.js';
import { TshirtRewardStatus } from '../entities/tshirt-reward-status.enum.js';

const sampleClaim = {
  id: 'claim-abc',
  userId: 'user-123',
  status: TshirtRewardStatus.Pending,
  size: 'M',
  fullName: 'Jean Dupont',
  street: '1 rue Test',
  city: 'Paris',
  postalCode: '75001',
  country: 'France',
  trackingNumber: null,
  claimedAt: new Date('2026-06-25T10:00:00.000Z'),
  shippedAt: null,
  updatedAt: new Date('2026-06-25T10:00:00.000Z'),
};

describe('isDiscordWebhookUrl', () => {
  it('detects discord.com webhooks', () => {
    expect(
      isDiscordWebhookUrl('https://discord.com/api/webhooks/123456/abcdef'),
    ).toBe(true);
  });

  it('detects legacy discordapp.com webhooks', () => {
    expect(
      isDiscordWebhookUrl('https://discordapp.com/api/webhooks/123456/abcdef'),
    ).toBe(true);
  });

  it('rejects non-discord URLs', () => {
    expect(isDiscordWebhookUrl('https://hooks.slack.com/services/xxx')).toBe(
      false,
    );
  });
});

describe('buildTshirtOpsWebhookPayload', () => {
  it('builds generic JSON for non-Discord webhooks', () => {
    const payload = buildTshirtOpsWebhookPayload(
      sampleClaim,
      'https://hooks.slack.com/services/xxx',
    );
    expect(payload).toMatchObject({
      type: 'tshirt_reward_claim',
      claimId: 'claim-abc',
      fullName: 'Jean Dupont',
    });
    expect('embeds' in payload).toBe(false);
  });

  it('builds Discord embed payload for Discord webhooks', () => {
    const payload = buildTshirtOpsWebhookPayload(
      sampleClaim,
      'https://discord.com/api/webhooks/123/abc',
    );

    expect('content' in payload).toBe(true);
    expect('embeds' in payload).toBe(true);
    if (!('embeds' in payload)) return;

    expect(payload.content).toContain('Nouveau claim t-shirt');
    expect(payload.embeds[0]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Nom', value: 'Jean Dupont' }),
        expect.objectContaining({ name: 'Taille', value: 'M' }),
        expect.objectContaining({ name: 'User ID', value: 'user-123' }),
      ]),
    );
  });
});
