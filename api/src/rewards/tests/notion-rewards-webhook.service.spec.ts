import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TshirtRewardStatus } from '../entities/tshirt-reward-status.enum.js';
import { TshirtRewardType } from '../entities/tshirt-reward-type.enum.js';
import { signNotionWebhookPayload } from '../lib/notion-webhook-signature.js';
import { NotionRewardsWebhookService } from '../notion-rewards-webhook.service.js';

const notifyTshirtRewardStatusUpdated = jest.fn();

describe('NotionRewardsWebhookService', () => {
  const claimsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((row: unknown) => row),
    update: jest.fn(),
  };

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'NOTION_WEBHOOK_VERIFICATION_TOKEN') return 'secret_wh';
      if (key === 'NOTION_TOKEN') return 'ntn_test';
      if (key === 'NOTION_REWARDS_DB_ID') return 'db-rewards';
      if (key === 'NOTION_REWARDS_STATUS_DEBOUNCE_MINUTES') return '5';
      return undefined;
    }),
  } as unknown as ConfigService;

  let service: NotionRewardsWebhookService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as typeof fetch;
    service = new NotionRewardsWebhookService(claimsRepo as never, config, {
      notifyTshirtRewardStatusUpdated,
    } as never);
  });

  it('accepts handshake without verification token configured', async () => {
    const openConfig = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    const openService = new NotionRewardsWebhookService(
      claimsRepo as never,
      openConfig,
      { notifyTshirtRewardStatusUpdated } as never,
    );
    const raw = Buffer.from(JSON.stringify({ verification_token: 'secret_x' }));
    await expect(openService.handle(raw, undefined)).resolves.toEqual({
      ok: true,
    });
  });

  it('rejects signed events when verification token is missing', async () => {
    const openConfig = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    const openService = new NotionRewardsWebhookService(
      claimsRepo as never,
      openConfig,
      { notifyTshirtRewardStatusUpdated } as never,
    );
    const raw = Buffer.from(
      JSON.stringify({ type: 'page.properties_updated' }),
    );
    await expect(openService.handle(raw, 'sha256=abc')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('starts pending instead of immediate shipped sync', async () => {
    const claim = {
      id: 'claim-1',
      userId: 'user-1',
      rewardType: TshirtRewardType.ReferralLimited,
      status: TshirtRewardStatus.Pending,
      notionPageId: 'page-1',
      notionPendingStatus: null,
      notionPendingSince: null,
      shippedAt: null,
    };
    claimsRepo.findOne.mockResolvedValue(claim);

    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'page-1',
        parent: { type: 'database_id', database_id: 'db-rewards' },
        properties: {
          Statut: { type: 'status', status: { name: 'Expédié' } },
          'Claim ID': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'claim-1' }],
          },
        },
      }),
    });

    const event = {
      type: 'page.properties_updated',
      entity: { id: 'page-1', type: 'page' },
    };
    const raw = Buffer.from(JSON.stringify(event));
    const signature = signNotionWebhookPayload(raw, 'secret_wh');

    await service.handle(raw, signature);

    expect(claimsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TshirtRewardStatus.Pending,
        notionPendingStatus: TshirtRewardStatus.Shipped,
        notionPendingSince: expect.any(Date),
      }),
    );
    expect(notifyTshirtRewardStatusUpdated).not.toHaveBeenCalled();
  });

  it('refuses sync when Claim ID does not match', async () => {
    claimsRepo.findOne.mockResolvedValue({
      id: 'claim-1',
      notionPageId: 'page-1',
      status: TshirtRewardStatus.Pending,
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'page-1',
        parent: { type: 'database_id', database_id: 'db-rewards' },
        properties: {
          Statut: { type: 'status', status: { name: 'Expédié' } },
          'Claim ID': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'other-claim' }],
          },
        },
      }),
    });

    const event = {
      type: 'page.properties_updated',
      entity: { id: 'page-1', type: 'page' },
    };
    const raw = Buffer.from(JSON.stringify(event));
    const signature = signNotionWebhookPayload(raw, 'secret_wh');

    await service.handle(raw, signature);

    expect(claimsRepo.save).not.toHaveBeenCalled();
    expect(notifyTshirtRewardStatusUpdated).not.toHaveBeenCalled();
  });

  it('cancels pending when status reverts before debounce', async () => {
    claimsRepo.findOne.mockResolvedValue({
      id: 'claim-1',
      userId: 'user-1',
      rewardType: TshirtRewardType.ReferralLimited,
      status: TshirtRewardStatus.Pending,
      notionPageId: 'page-1',
      notionPendingStatus: TshirtRewardStatus.Shipped,
      notionPendingSince: new Date(),
      shippedAt: null,
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'page-1',
        parent: { type: 'database_id', database_id: 'db-rewards' },
        properties: {
          Statut: { type: 'status', status: { name: 'À traiter' } },
          'Claim ID': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'claim-1' }],
          },
        },
      }),
    });

    const event = {
      type: 'page.properties_updated',
      entity: { id: 'page-1', type: 'page' },
    };
    const raw = Buffer.from(JSON.stringify(event));
    const signature = signNotionWebhookPayload(raw, 'secret_wh');

    await service.handle(raw, signature);

    expect(claimsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TshirtRewardStatus.Pending,
        notionPendingStatus: null,
        notionPendingSince: null,
      }),
    );
    expect(notifyTshirtRewardStatusUpdated).not.toHaveBeenCalled();
  });
});
