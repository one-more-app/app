import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

await jest.unstable_mockModule('../../social/access.service.js', () => ({
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
    service = new RewardsService(
      claimsRepo as any,
      accessService as any,
      config as unknown as ConfigService,
    );
  });

  it('rejects claim when not eligible', async () => {
    accessService.getAccess.mockResolvedValue({ tshirtRewardEligible: false });
    await expect(
      service.claimTshirt('user-1', {
        rewardType: 'referral_limited' as any,
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
    accessService.getAccess.mockResolvedValue({ tshirtRewardEligible: true });
    claimsRepo.findOne
      .mockResolvedValueOnce({ id: 'claim-1', status: 'pending' })
      .mockResolvedValueOnce({ id: 'claim-1', status: 'pending' });
    await expect(
      service.claimTshirt('user-1', {
        rewardType: 'referral_limited' as any,
        fullName: 'Jean Dupont',
        street: '1 rue Test',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        size: 'M',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates claim when eligible', async () => {
    accessService.getAccess.mockResolvedValue({ tshirtRewardEligible: true });
    claimsRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
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
      fullName: 'Jean Dupont',
      street: '1 rue Test',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      trackingNumber: null,
      claimedAt,
      shippedAt: null,
    });

    const result = await service.claimTshirt('user-1', {
      rewardType: 'referral_limited' as any,
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
});
