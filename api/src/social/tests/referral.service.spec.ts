import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const notifyFriendAccepted = jest.fn();
const notifyReferralUsed = jest.fn();
const notifyTshirtRewardUnlocked = jest.fn();
const emitAccessUpdated = jest.fn();

jest.unstable_mockModule('../access.service.js', () => ({
  AccessService: class AccessService {},
}));

const { ReferralService } = await import('../referral.service.js');

describe('ReferralService', () => {
  const profilesRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const friendshipsRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const invitesService = {
    findInviterProfileByCode: jest.fn(),
  };
  const accessService = {
    hasJustUnlockedTshirtReward: jest.fn(),
  };
  const notifications = {
    notifyFriendAccepted,
    notifyReferralUsed,
    notifyTshirtRewardUnlocked,
  };
  const realtime = {
    emitAccessUpdated,
  };

  let service: InstanceType<typeof ReferralService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReferralService(
      profilesRepo as any,
      friendshipsRepo as any,
      invitesService as any,
      accessService as any,
      notifications as any,
      realtime as any,
    );
  });

  it('applies a valid referral code', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue({
      userId: 'referrer-1',
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      referredByUserId: null,
    });
    friendshipsRepo.findOne.mockResolvedValue(null);
    friendshipsRepo.save.mockResolvedValue({
      id: 'friendship-1',
      status: 'accepted',
    });
    accessService.hasJustUnlockedTshirtReward.mockResolvedValue(false);

    const result = await service.applyReferralCode('user-1', 'abc12345');
    expect(result).toEqual({ ok: true, referrerUserId: 'referrer-1' });
    expect(profilesRepo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      { referredByUserId: 'referrer-1' },
    );
    expect(friendshipsRepo.save).toHaveBeenCalledWith({
      requesterId: 'referrer-1',
      addresseeId: 'user-1',
      status: 'accepted',
    });
    expect(emitAccessUpdated).toHaveBeenCalledWith('referrer-1', {
      reason: 'referral_used',
      tshirtUnlocked: false,
    });
    expect(notifyReferralUsed).toHaveBeenCalledWith({
      referrerId: 'referrer-1',
      referredUserId: 'user-1',
    });
    expect(notifyFriendAccepted).not.toHaveBeenCalled();
    expect(notifyTshirtRewardUnlocked).not.toHaveBeenCalled();
  });

  it('notifies t-shirt unlock on 5th referral', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue({
      userId: 'referrer-1',
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      referredByUserId: null,
    });
    friendshipsRepo.findOne.mockResolvedValue(null);
    friendshipsRepo.save.mockResolvedValue({
      id: 'friendship-1',
      status: 'accepted',
    });
    accessService.hasJustUnlockedTshirtReward.mockResolvedValue(true);

    await service.applyReferralCode('user-1', 'abc12345');

    expect(emitAccessUpdated).toHaveBeenCalledWith('referrer-1', {
      reason: 'referral_used',
      tshirtUnlocked: true,
    });
    expect(notifyTshirtRewardUnlocked).toHaveBeenCalledWith({
      userId: 'referrer-1',
    });
  });

  it('rejects invalid code', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue(null);
    await expect(
      service.applyReferralCode('user-1', 'badcode'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects self referral', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue({
      userId: 'user-1',
    });
    await expect(
      service.applyReferralCode('user-1', 'abc12345'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when code already used', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue({
      userId: 'referrer-1',
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      referredByUserId: 'referrer-2',
    });
    await expect(
      service.applyReferralCode('user-1', 'abc12345'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('silently ignores invalid code on signup', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue(null);
    await expect(
      service.applyReferralCodeOnSignup({
        newUserId: 'user-1',
        inviteCode: 'badcode',
      }),
    ).resolves.toBeUndefined();
  });

  it('reuses reverse accepted friendship instead of creating a duplicate', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue({
      userId: 'referrer-1',
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      referredByUserId: null,
    });
    friendshipsRepo.findOne.mockResolvedValue({
      id: 'friendship-reverse',
      requesterId: 'user-1',
      addresseeId: 'referrer-1',
      status: 'accepted',
    });
    accessService.hasJustUnlockedTshirtReward.mockResolvedValue(false);

    await service.applyReferralCode('user-1', 'abc12345');

    expect(friendshipsRepo.save).not.toHaveBeenCalled();
    expect(profilesRepo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      { referredByUserId: 'referrer-1' },
    );
  });

  it('upgrades reverse pending friendship to accepted', async () => {
    invitesService.findInviterProfileByCode.mockResolvedValue({
      userId: 'referrer-1',
    });
    profilesRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      referredByUserId: null,
    });
    const existing = {
      id: 'friendship-reverse',
      requesterId: 'user-1',
      addresseeId: 'referrer-1',
      status: 'pending',
    };
    friendshipsRepo.findOne.mockResolvedValue(existing);
    friendshipsRepo.save.mockResolvedValue({
      ...existing,
      status: 'accepted',
    });
    accessService.hasJustUnlockedTshirtReward.mockResolvedValue(false);

    await service.applyReferralCode('user-1', 'abc12345');

    expect(friendshipsRepo.save).toHaveBeenCalledWith({
      ...existing,
      status: 'accepted',
    });
    expect(friendshipsRepo.save).not.toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'referrer-1',
        addresseeId: 'user-1',
      }),
    );
  });
});
