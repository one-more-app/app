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
import { buildTshirtOpsWebhookPayload } from './lib/tshirt-ops-webhook.js';

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
    const access = await this.accessService.getAccess(userId);
    if (!access.tshirtRewardEligible) return;

    const existing = await this.claimsRepo.findOne({
      where: { userId, rewardType: TshirtRewardType.ReferralLimited },
    });
    if (existing) return;

    await this.claimsRepo.save(
      this.claimsRepo.create({
        userId,
        rewardType: TshirtRewardType.ReferralLimited,
        status: TshirtRewardStatus.ClaimPending,
      }),
    );
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
    dto: ClaimTshirtDto,
  ): Promise<TshirtRewardClaimDto> {
    if (dto.rewardType === TshirtRewardType.ReferralLimited) {
      await this.ensureReferralPendingReward(userId);
    }
    const reward = await this.claimsRepo.findOne({
      where: { userId, rewardType: dto.rewardType },
    });
    if (!reward) {
      throw new ForbiddenException("Aucune récompense t-shirt à réclamer");
    }
    if (reward.status !== TshirtRewardStatus.ClaimPending) {
      throw new ConflictException('Tu as déjà réclamé cette récompense');
    }
    reward.size = dto.size;
    reward.fullName = dto.fullName.trim();
    reward.street = dto.street.trim();
    reward.city = dto.city.trim();
    reward.postalCode = dto.postalCode.trim();
    reward.country = dto.country.trim();
    reward.status = TshirtRewardStatus.Pending;
    reward.claimedAt = new Date();

    const claim = await this.claimsRepo.save(reward);

    void this.notifyOps(claim);

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
