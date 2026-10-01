import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  EXERCISE_BONUS_FOR_USING_REFERRAL,
  EXERCISE_BONUS_PER_REFERRAL,
  computeExerciseLimit,
  computeReferralBonus,
  computeReferralRewardKind,
  computeReferralsUntilTshirt,
  computeTshirtRewardEligible,
  type ReferralRewardKind,
} from '../shared/access-config.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { TshirtRewardClaimEntity } from '../rewards/entities/tshirt-reward-claim.entity.js';
import { TshirtRewardType } from '../rewards/entities/tshirt-reward-type.enum.js';

export type UserAccessDto = {
  exerciseLimit: number;
  activeExerciseCount: number;
  canAddExercise: boolean;
  referralCount: number;
  hasUsedReferralCode: boolean;
  bonusFromReferrals: number;
  bonusFromBeingReferred: number;
  isPremium: boolean;
  /** True uniquement pour le chemin legacy t-shirt (claim existant). */
  tshirtRewardEligible: boolean;
  referralsUntilTshirt: number;
  referralRewardKind: ReferralRewardKind;
};

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(TshirtRewardClaimEntity)
    private readonly tshirtClaimsRepo: Repository<TshirtRewardClaimEntity>,
  ) {}

  async getAccess(userId: string): Promise<UserAccessDto> {
    const [profile, user] = await Promise.all([
      this.profilesRepo.findOne({ where: { userId } }),
      this.usersRepo.findOne({ where: { id: userId }, select: ['isPremium'] }),
    ]);
    const activeExerciseCount = await this.countActiveExercises(userId);
    const referralCount = await this.countReferrals(userId);
    const hasUsedReferralCode = profile?.referredByUserId != null;
    const isPremium = user?.isPremium ?? false;
    const bonusFromReferrals = computeReferralBonus(referralCount);
    const bonusFromBeingReferred = hasUsedReferralCode
      ? EXERCISE_BONUS_FOR_USING_REFERRAL
      : 0;
    const exerciseLimit = computeExerciseLimit({
      referralCount,
      hasUsedReferralCode,
    });
    const canAddExercise = isPremium || activeExerciseCount < exerciseLimit;
    const hasReferralTshirtClaim =
      (await this.tshirtClaimsRepo.findOne({
        where: {
          userId,
          rewardType: TshirtRewardType.ReferralLimited,
        },
        select: ['id'],
      })) != null;
    const referralRewardKind = computeReferralRewardKind({
      referralCount,
      hasReferralTshirtClaim,
    });
    const tshirtRewardEligible = referralRewardKind === 'tshirt';
    const referralsUntilTshirt = computeReferralsUntilTshirt({ referralCount });

    return {
      exerciseLimit,
      activeExerciseCount,
      canAddExercise,
      referralCount,
      hasUsedReferralCode,
      bonusFromReferrals,
      bonusFromBeingReferred,
      isPremium,
      tshirtRewardEligible,
      referralsUntilTshirt,
      referralRewardKind,
    };
  }

  async countActiveExercises(userId: string): Promise<number> {
    return await this.trackedRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
  }

  async countReferrals(userId: string): Promise<number> {
    return await this.profilesRepo.count({
      where: { referredByUserId: userId },
    });
  }

  async hasJustUnlockedTshirtReward(userId: string): Promise<boolean> {
    const referralCount = await this.countReferrals(userId);
    return (
      computeTshirtRewardEligible({ referralCount }) &&
      !computeTshirtRewardEligible({ referralCount: referralCount - 1 })
    );
  }

  async assertCanAddExercise(userId: string): Promise<void> {
    const access = await this.getAccess(userId);
    if (!access.canAddExercise) {
      throw new ForbiddenException({
        message: `Limite de ${access.exerciseLimit} exercices atteinte. Passe Premium pour des exercices illimités ou parraine un pote pour gagner ${EXERCISE_BONUS_PER_REFERRAL} exercices supplémentaires.`,
        code: 'EXERCISE_LIMIT_REACHED',
        exerciseLimit: access.exerciseLimit,
        activeExerciseCount: access.activeExerciseCount,
      });
    }
  }

  async isNewActiveExercise(
    userId: string,
    clientId: string,
  ): Promise<boolean> {
    const existing = await this.trackedRepo.findOne({
      where: { userId, clientId },
    });
    if (!existing) return true;
    return existing.deletedAt != null;
  }
}
