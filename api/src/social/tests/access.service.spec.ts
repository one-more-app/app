import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const EXERCISE_LIMIT_BASE = 10;
const EXERCISE_BONUS_PER_REFERRAL = 10;
const EXERCISE_BONUS_FOR_USING_REFERRAL = 10;

await jest.unstable_mockModule('../../shared/access-config.js', () => ({
  EXERCISE_LIMIT_BASE,
  EXERCISE_BONUS_PER_REFERRAL,
  EXERCISE_BONUS_FOR_USING_REFERRAL,
  computeExerciseLimit: ({
    referralCount,
    hasUsedReferralCode,
  }: {
    referralCount: number;
    hasUsedReferralCode: boolean;
  }) => {
    const referralBonus = referralCount * EXERCISE_BONUS_PER_REFERRAL;
    const inviteeBonus = hasUsedReferralCode
      ? EXERCISE_BONUS_FOR_USING_REFERRAL
      : 0;
    return EXERCISE_LIMIT_BASE + referralBonus + inviteeBonus;
  },
  computeReferralBonus: (referralCount: number) =>
    referralCount * EXERCISE_BONUS_PER_REFERRAL,
  computeTshirtRewardEligible: ({ referralCount }: { referralCount: number }) =>
    referralCount >= 5,
  computeReferralsUntilTshirt: ({ referralCount }: { referralCount: number }) =>
    Math.max(0, 5 - referralCount),
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
  const usersRepo = {
    findOne: jest.fn(),
  };

  let service: InstanceType<typeof AccessService>;

  beforeEach(() => {
    jest.clearAllMocks();
    usersRepo.findOne.mockResolvedValue({ isPremium: false });
    service = new AccessService(
      profilesRepo as any,
      trackedRepo as any,
      usersRepo as any,
    );
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

  it('does not cap referral bonus', async () => {
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: null });
    trackedRepo.count.mockResolvedValue(0);
    profilesRepo.count.mockResolvedValue(15);

    const access = await service.getAccess('user-1');
    expect(access.exerciseLimit).toBe(
      EXERCISE_LIMIT_BASE + 15 * EXERCISE_BONUS_PER_REFERRAL,
    );
    expect(access.bonusFromReferrals).toBe(15 * EXERCISE_BONUS_PER_REFERRAL);
  });

  it('marks t-shirt eligible with 5 referrals', async () => {
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: null });
    trackedRepo.count.mockResolvedValue(0);
    profilesRepo.count.mockResolvedValue(5);

    const access = await service.getAccess('user-1');
    expect(access.tshirtRewardEligible).toBe(true);
    expect(access.referralsUntilTshirt).toBe(0);
  });

  it('allows premium user above exercise limit', async () => {
    usersRepo.findOne.mockResolvedValue({ isPremium: true });
    profilesRepo.findOne.mockResolvedValue({ referredByUserId: null });
    trackedRepo.count.mockResolvedValue(50);
    profilesRepo.count.mockResolvedValue(0);

    const access = await service.getAccess('user-1');
    expect(access.isPremium).toBe(true);
    expect(access.canAddExercise).toBe(true);
    await expect(service.assertCanAddExercise('user-1')).resolves.toBeUndefined();
  });
});
