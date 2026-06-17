import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const EXERCISE_LIMIT_BASE = 10;
const EXERCISE_BONUS_PER_REFERRAL = 10;
const EXERCISE_BONUS_FOR_USING_REFERRAL = 5;

await jest.unstable_mockModule('../../shared/access-config.js', () => ({
  EXERCISE_LIMIT_BASE,
  EXERCISE_BONUS_PER_REFERRAL,
  EXERCISE_BONUS_FOR_USING_REFERRAL,
  MAX_REWARDED_REFERRALS: 10,
  computeExerciseLimit: ({
    referralCount,
    hasUsedReferralCode,
  }: {
    referralCount: number;
    hasUsedReferralCode: boolean;
  }) => {
    const referralBonus =
      Math.min(referralCount, 10) * EXERCISE_BONUS_PER_REFERRAL;
    const inviteeBonus = hasUsedReferralCode
      ? EXERCISE_BONUS_FOR_USING_REFERRAL
      : 0;
    return EXERCISE_LIMIT_BASE + referralBonus + inviteeBonus;
  },
  computeReferralBonus: (referralCount: number) =>
    Math.min(referralCount, 10) * EXERCISE_BONUS_PER_REFERRAL,
}));

const { AccessService } = await import('../access.service.js');

describe('AccessService', () => {
  const profilesRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
  };
  const trackedRepo = {
    count: jest.fn(),
  };

  let service: InstanceType<typeof AccessService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccessService(profilesRepo as any, trackedRepo as any);
  });

  it('allows add when under base limit', async () => {
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: null });
    trackedRepo.count.mockResolvedValue(5);
    profilesRepo.count.mockResolvedValue(0);

    const access = await service.getAccess('user-1');
    expect(access.exerciseLimit).toBe(EXERCISE_LIMIT_BASE);
    expect(access.canAddExercise).toBe(true);
    await expect(service.assertCanAddExercise('user-1')).resolves.toBeUndefined();
  });

  it('blocks add at base limit', async () => {
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: null });
    trackedRepo.count.mockResolvedValue(10);
    profilesRepo.count.mockResolvedValue(0);

    const access = await service.getAccess('user-1');
    expect(access.canAddExercise).toBe(false);
    await expect(service.assertCanAddExercise('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('increases limit after one referral', async () => {
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: null });
    trackedRepo.count.mockResolvedValue(10);
    profilesRepo.count.mockResolvedValue(1);

    const access = await service.getAccess('user-1');
    expect(access.exerciseLimit).toBe(
      EXERCISE_LIMIT_BASE + EXERCISE_BONUS_PER_REFERRAL,
    );
    expect(access.canAddExercise).toBe(true);
    expect(access.bonusFromReferrals).toBe(EXERCISE_BONUS_PER_REFERRAL);
  });

  it('adds invitee bonus when user used a referral code', async () => {
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: 'referrer-1' });
    trackedRepo.count.mockResolvedValue(7);
    profilesRepo.count.mockResolvedValue(0);

    const access = await service.getAccess('user-1');
    expect(access.exerciseLimit).toBe(
      EXERCISE_LIMIT_BASE + EXERCISE_BONUS_FOR_USING_REFERRAL,
    );
    expect(access.hasUsedReferralCode).toBe(true);
    expect(access.bonusFromBeingReferred).toBe(EXERCISE_BONUS_FOR_USING_REFERRAL);
    expect(access.canAddExercise).toBe(true);
  });
});
