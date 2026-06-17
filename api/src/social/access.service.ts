import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  EXERCISE_BONUS_FOR_USING_REFERRAL,
  EXERCISE_BONUS_PER_REFERRAL,
  computeExerciseLimit,
  computeReferralBonus,
} from '../shared/access-config.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';

export type UserAccessDto = {
  exerciseLimit: number;
  activeExerciseCount: number;
  canAddExercise: boolean;
  referralCount: number;
  hasUsedReferralCode: boolean;
  bonusFromReferrals: number;
  bonusFromBeingReferred: number;
};

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
  ) {}

  async getAccess(userId: string): Promise<UserAccessDto> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    const activeExerciseCount = await this.countActiveExercises(userId);
    const referralCount = await this.countReferrals(userId);
    const hasUsedReferralCode = profile?.referredByUserId != null;
    const bonusFromReferrals = computeReferralBonus(referralCount);
    const bonusFromBeingReferred = hasUsedReferralCode
      ? EXERCISE_BONUS_FOR_USING_REFERRAL
      : 0;
    const exerciseLimit = computeExerciseLimit({
      referralCount,
      hasUsedReferralCode,
    });
    const canAddExercise = activeExerciseCount < exerciseLimit;

    return {
      exerciseLimit,
      activeExerciseCount,
      canAddExercise,
      referralCount,
      hasUsedReferralCode,
      bonusFromReferrals,
      bonusFromBeingReferred,
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

  async assertCanAddExercise(userId: string): Promise<void> {
    const access = await this.getAccess(userId);
    if (!access.canAddExercise) {
      throw new ForbiddenException({
        message: `Limite de ${access.exerciseLimit} exercices atteinte. Parraine un pote pour gagner ${EXERCISE_BONUS_PER_REFERRAL} exercices supplémentaires.`,
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
