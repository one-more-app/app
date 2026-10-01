import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { TshirtRewardType } from '../entities/tshirt-reward-type.enum.js';

jest.unstable_mockModule('../../social/access.service.js', () => ({
  AccessService: class MockAccessService {},
}));

const { RewardsService } = await import('../rewards.service.js');

describe('RewardsService', () => {
  const claimsRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data) => data),
  };
  const accessService = {
    getAccess: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };

  let service: InstanceType<typeof RewardsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    claimsRepo.find.mockResolvedValue([]);
    service = new RewardsService(
      claimsRepo as any,
      accessService as any,
      config as unknown as ConfigService,
    );
  });

  it('does not create new referral_limited claims when eligible', async () => {
    accessService.getAccess.mockResolvedValue({ tshirtRewardEligible: true });
    claimsRepo.findOne.mockResolvedValue(null);
    claimsRepo.find.mockResolvedValue([]);

    await service.getTshirtRewardStatus('user-1');

    expect(claimsRepo.save).not.toHaveBeenCalled();
    expect(claimsRepo.create).not.toHaveBeenCalled();
  });

  it('rejects claim when no pending reward exists', async () => {
    claimsRepo.findOne.mockResolvedValue(null);
    await expect(
      service.claimTshirt('user-1', null, {
        rewardType: TshirtRewardType.ReferralLimited,
        fullName: 'Jean Dupont',
        street: '1 rue Test',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        size: 'M',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate claim', async () => {
    claimsRepo.findOne.mockResolvedValue({
      id: 'claim-1',
      status: 'pending',
      rewardType: 'referral_limited',
    });
    await expect(
      service.claimTshirt('user-1', null, {
        rewardType: TshirtRewardType.ReferralLimited,
        fullName: 'Jean Dupont',
        street: '1 rue Test',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        size: 'M',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('claims existing pending referral reward', async () => {
    claimsRepo.findOne.mockResolvedValue({
      id: 'claim-1',
      userId: 'user-1',
      rewardType: 'referral_limited',
      status: 'claim_pending',
    });
    const claimedAt = new Date('2026-01-01T00:00:00.000Z');
    claimsRepo.save.mockResolvedValue({
      id: 'claim-1',
      userId: 'user-1',
      rewardType: 'referral_limited',
      status: 'pending',
      size: 'M',
      gender: null,
      fullName: 'Jean Dupont',
      street: '1 rue Test',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      trackingNumber: null,
      claimedAt,
      shippedAt: null,
    });

    const result = await service.claimTshirt('user-1', 'user@example.com', {
      rewardType: TshirtRewardType.ReferralLimited,
      fullName: 'Jean Dupont',
      street: '1 rue Test',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      size: 'M',
    });

    expect(result.id).toBe('claim-1');
    expect(result.status).toBe('pending');
    expect(result.rewardType).toBe('referral_limited');
    expect(claimsRepo.save).toHaveBeenCalled();
  });

  it('hasReferralTshirtClaim returns true when claim exists', async () => {
    claimsRepo.findOne.mockResolvedValue({ id: 'claim-1' });
    await expect(service.hasReferralTshirtClaim('user-1')).resolves.toBe(true);
  });

  it('hasReferralTshirtClaim returns false when missing', async () => {
    claimsRepo.findOne.mockResolvedValue(null);
    await expect(service.hasReferralTshirtClaim('user-1')).resolves.toBe(false);
  });
});
