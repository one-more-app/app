import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingService } from '../billing/billing.service.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { ReferralProGrantEntity } from '../rewards/entities/referral-pro-grant.entity.js';
import { RewardsService } from '../rewards/rewards.service.js';
import {
  REFERRALS_FOR_TSHIRT_REWARD,
  type ReferralRewardKind,
} from '../shared/access-config.js';

export type EnsureReferralProGrantResult =
  | 'granted'
  | 'already'
  | 'skipped'
  | 'failed';

@Injectable()
export class ReferralRewardService {
  private readonly logger = new Logger(ReferralRewardService.name);

  constructor(
    @InjectRepository(ReferralProGrantEntity)
    private readonly grantsRepo: Repository<ReferralProGrantEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly rewardsService: RewardsService,
    private readonly billing: BillingService,
  ) {}

  async resolveReferralRewardKind(
    userId: string,
    referralCount: number,
  ): Promise<ReferralRewardKind> {
    if (referralCount < REFERRALS_FOR_TSHIRT_REWARD) {
      return null;
    }
    const hasTshirtClaim =
      await this.rewardsService.hasReferralTshirtClaim(userId);
    return hasTshirtClaim ? 'tshirt' : 'pro_month';
  }

  async ensureReferralProGrant(
    userId: string,
  ): Promise<EnsureReferralProGrantResult> {
    if (await this.rewardsService.hasReferralTshirtClaim(userId)) {
      return 'skipped';
    }

    const existing = await this.grantsRepo.findOne({ where: { userId } });
    if (existing?.status === 'granted') {
      return 'already';
    }

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'isPremium'],
    });
    if (user?.isPremium) {
      return 'skipped';
    }

    const result = await this.billing.grantPromotionalPremium(userId);
    if (!result.ok) {
      this.logger.warn(
        `Referral PRO grant failed for ${userId}: ${result.error}`,
      );
      if (existing) {
        existing.status = 'failed';
        existing.errorMessage = result.error;
        await this.grantsRepo.save(existing);
      } else {
        await this.grantsRepo.save(
          this.grantsRepo.create({
            userId,
            status: 'failed',
            grantedAt: null,
            errorMessage: result.error,
          }),
        );
      }
      return 'failed';
    }

    if (existing) {
      existing.status = 'granted';
      existing.grantedAt = new Date();
      existing.errorMessage = null;
      await this.grantsRepo.save(existing);
    } else {
      try {
        await this.grantsRepo.save(
          this.grantsRepo.create({
            userId,
            status: 'granted',
            grantedAt: new Date(),
            errorMessage: null,
          }),
        );
      } catch {
        // Race: another request inserted the unique userId row.
        return 'already';
      }
    }
    return 'granted';
  }
}
