import { ForbiddenException } from '@nestjs/common';
import { AccessTier } from '../entities/access-tier.enum.js';
import { AccessService } from '../access.service.js';

describe('AccessService', () => {
  const profilesRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const trackedRepo = {
    count: jest.fn(),
  };
  const friendshipsRepo = {
    count: jest.fn(),
  };

  let service: AccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccessService(
      profilesRepo as any,
      trackedRepo as any,
      friendshipsRepo as any,
    );
  });

  it('allows add when under limit', async () => {
    profilesRepo.findOne.mockResolvedValue({ accessTier: AccessTier.LIMITED });
    trackedRepo.count.mockResolvedValue(5);
    friendshipsRepo.count.mockResolvedValue(0);

    const access = await service.getAccess('user-1');
    expect(access.canAddExercise).toBe(true);
    await expect(service.assertCanAddExercise('user-1')).resolves.toBeUndefined();
  });

  it('blocks add at limit', async () => {
    profilesRepo.findOne.mockResolvedValue({ accessTier: AccessTier.LIMITED });
    trackedRepo.count.mockResolvedValue(6);
    friendshipsRepo.count.mockResolvedValue(0);

    const access = await service.getAccess('user-1');
    expect(access.canAddExercise).toBe(false);
    await expect(service.assertCanAddExercise('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows unlimited for full tier', async () => {
    profilesRepo.findOne.mockResolvedValue({ accessTier: AccessTier.FULL });
    trackedRepo.count.mockResolvedValue(20);
    friendshipsRepo.count.mockResolvedValue(2);

    const access = await service.getAccess('user-1');
    expect(access.exerciseLimit).toBeNull();
    expect(access.canAddExercise).toBe(true);
  });
});
