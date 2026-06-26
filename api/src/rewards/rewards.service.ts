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
import { buildTshirtOpsWebhookPayload } from './lib/tshirt-ops-webhook.js';

export type TshirtRewardClaimDto = {
  id: string;
  status: TshirtRewardStatus;
  size: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  trackingNumber: string | null;
  claimedAt: string;
  shippedAt: string | null;
};

export type TshirtRewardStatusResponse = {
  eligible: boolean;
  claim: TshirtRewardClaimDto | null;
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
      status: claim.status,
      size: claim.size,
      fullName: claim.fullName,
      street: claim.street,
      city: claim.city,
      postalCode: claim.postalCode,
      country: claim.country,
      trackingNumber: claim.trackingNumber,
      claimedAt: claim.claimedAt.toISOString(),
      shippedAt: claim.shippedAt?.toISOString() ?? null,
    };
  }

  async getTshirtRewardStatus(
    userId: string,
  ): Promise<TshirtRewardStatusResponse> {
    const access = await this.accessService.getAccess(userId);
    const claim = await this.claimsRepo.findOne({ where: { userId } });

    return {
      eligible: access.tshirtRewardEligible,
      claim: claim ? this.toDto(claim) : null,
    };
  }

  async claimTshirt(
    userId: string,
    dto: ClaimTshirtDto,
  ): Promise<TshirtRewardClaimDto> {
    const access = await this.accessService.getAccess(userId);
    if (!access.tshirtRewardEligible) {
      throw new ForbiddenException(
        'Tu n’es pas encore éligible au t-shirt de parrainage',
      );
    }

    const existing = await this.claimsRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Tu as déjà réclamé ton t-shirt');
    }

    const claim = await this.claimsRepo.save(
      this.claimsRepo.create({
        userId,
        status: TshirtRewardStatus.Pending,
        size: dto.size,
        fullName: dto.fullName.trim(),
        street: dto.street.trim(),
        city: dto.city.trim(),
        postalCode: dto.postalCode.trim(),
        country: dto.country.trim(),
      }),
    );

    void this.notifyOps(claim);

    return this.toDto(claim);
  }

  async listTshirtClaimsForAdmin(): Promise<TshirtRewardClaimDto[]> {
    const claims = await this.claimsRepo.find({
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
