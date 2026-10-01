import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessService } from '../social/access.service.js';
import { ClaimTshirtDto } from './dto/claim-tshirt.dto.js';
import { TshirtRewardClaimEntity } from './entities/tshirt-reward-claim.entity.js';
import { TshirtRewardStatus } from './entities/tshirt-reward-status.enum.js';
import { TshirtRewardType } from './entities/tshirt-reward-type.enum.js';
import { buildTshirtNotionPayload } from './lib/build-tshirt-notion-payload.js';
import { NOTION_REWARD_STATUS_DEFAULT } from './lib/notion-rewards-constants.js';
import { ensureRewardsNotionDatabaseSchema } from './lib/notion-rewards-schema-sync.js';
import { buildTshirtOpsWebhookPayload } from './lib/tshirt-ops-webhook.js';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function readNotionEnv(config: ConfigService, key: string): string {
  const raw = config.get<string>(key)?.trim() ?? '';
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

export function readRewardsNotionDatabaseId(config: ConfigService): string {
  return readNotionEnv(config, 'NOTION_REWARDS_DB_ID');
}

export type TshirtRewardClaimDto = {
  id: string;
  rewardType: TshirtRewardType;
  status: TshirtRewardStatus;
  size: string | null;
  fullName: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  trackingNumber: string | null;
  claimedAt: string | null;
  shippedAt: string | null;
};

export type TshirtRewardStatusResponse = {
  pendingRewards: TshirtRewardType[];
  claims: TshirtRewardClaimDto[];
};

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(TshirtRewardClaimEntity)
    private readonly claimsRepo: Repository<TshirtRewardClaimEntity>,
    private readonly accessService: AccessService,
    private readonly config: ConfigService,
  ) {}

  private toDto(claim: TshirtRewardClaimEntity): TshirtRewardClaimDto {
    return {
      id: claim.id,
      rewardType: claim.rewardType,
      status: claim.status,
      size: claim.size,
      fullName: claim.fullName,
      street: claim.street,
      city: claim.city,
      postalCode: claim.postalCode,
      country: claim.country,
      trackingNumber: claim.trackingNumber,
      claimedAt: claim.claimedAt?.toISOString() ?? null,
      shippedAt: claim.shippedAt?.toISOString() ?? null,
    };
  }

  private async ensureReferralPendingReward(userId: string): Promise<void> {
    // Les nouveaux unlocks donnent 1 mois PRO (ReferralRewardService).
    // On ne crée plus de claims t-shirt referral — uniquement le legacy existant.
    void userId;
  }

  async hasReferralTshirtClaim(userId: string): Promise<boolean> {
    const existing = await this.claimsRepo.findOne({
      where: { userId, rewardType: TshirtRewardType.ReferralLimited },
    });
    return existing != null;
  }

  async grantAnnualClassicPackIfMissing(userId: string): Promise<boolean> {
    const existing = await this.claimsRepo.findOne({
      where: { userId, rewardType: TshirtRewardType.AnnualClassicPack },
    });
    if (existing) return false;

    await this.claimsRepo.save(
      this.claimsRepo.create({
        userId,
        rewardType: TshirtRewardType.AnnualClassicPack,
        status: TshirtRewardStatus.ClaimPending,
      }),
    );
    return true;
  }

  async getTshirtRewardStatus(
    userId: string,
  ): Promise<TshirtRewardStatusResponse> {
    await this.ensureReferralPendingReward(userId);
    const claims = await this.claimsRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    const pendingRewards = claims
      .filter((claim) => claim.status === TshirtRewardStatus.ClaimPending)
      .map((claim) => claim.rewardType);

    return {
      pendingRewards,
      claims: claims.map((claim) => this.toDto(claim)),
    };
  }

  async claimTshirt(
    userId: string,
    sessionEmail: string | null,
    dto: ClaimTshirtDto,
  ): Promise<TshirtRewardClaimDto> {
    if (dto.rewardType === TshirtRewardType.ReferralLimited) {
      await this.ensureReferralPendingReward(userId);
    }
    const reward = await this.claimsRepo.findOne({
      where: { userId, rewardType: dto.rewardType },
    });
    if (!reward) {
      throw new ForbiddenException('Aucune récompense t-shirt à réclamer');
    }
    if (reward.status !== TshirtRewardStatus.ClaimPending) {
      throw new ConflictException('Tu as déjà réclamé cette récompense');
    }
    reward.size = dto.size;
    reward.gender = null;
    reward.fullName = dto.fullName.trim();
    reward.street = dto.street.trim();
    reward.city = dto.city.trim();
    reward.postalCode = dto.postalCode.trim();
    reward.country = dto.country.trim();
    reward.status = TshirtRewardStatus.Pending;
    reward.claimedAt = new Date();

    const claim = await this.claimsRepo.save(reward);

    void this.notifyOps(claim);
    void this.notifyNotion(claim, sessionEmail);

    return this.toDto(claim);
  }

  async listTshirtClaimsForAdmin(): Promise<TshirtRewardClaimDto[]> {
    const claims = await this.claimsRepo.find({
      where: [
        { status: TshirtRewardStatus.Pending },
        { status: TshirtRewardStatus.Shipped },
        { status: TshirtRewardStatus.Delivered },
      ],
      order: { claimedAt: 'ASC' },
    });
    return claims.map((claim) => this.toDto(claim));
  }

  private rewardsNotionStatusName(): string {
    return (
      readNotionEnv(this.config, 'NOTION_REWARDS_STATUS') ||
      NOTION_REWARD_STATUS_DEFAULT
    );
  }

  private async notifyNotion(
    claim: TshirtRewardClaimEntity,
    sessionEmail: string | null,
  ): Promise<void> {
    const notionToken = readNotionEnv(this.config, 'NOTION_TOKEN');
    const notionDatabaseId = readRewardsNotionDatabaseId(this.config);
    if (!notionToken || !notionDatabaseId) {
      this.logger.debug(
        'Notion rewards non configuré (NOTION_TOKEN + NOTION_REWARDS_DB_ID).',
      );
      return;
    }

    const statusName = this.rewardsNotionStatusName();

    await ensureRewardsNotionDatabaseSchema(
      notionToken,
      notionDatabaseId,
      statusName,
      this.logger,
    );

    const body = buildTshirtNotionPayload(
      notionDatabaseId,
      claim,
      sessionEmail,
      statusName,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${NOTION_API_BASE}/pages`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${notionToken}`,
          'content-type': 'application/json',
          'notion-version': NOTION_VERSION,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(
          `Notion rewards claim failed (${response.status}): ${text}`,
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Notion rewards claim error: ${reason}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async notifyOps(claim: TshirtRewardClaimEntity): Promise<void> {
    const webhookUrl = this.config.get<string>('TSHIRT_OPS_WEBHOOK_URL');
    if (!webhookUrl?.trim()) return;

    const payload = buildTshirtOpsWebhookPayload(claim, webhookUrl);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        this.logger.warn(
          `T-shirt ops webhook failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      this.logger.warn('T-shirt ops webhook error', error);
    }
  }
}
