import { BadRequestException } from '@nestjs/common';
import { UserSearchService } from '../user-search.service.js';

describe('UserSearchService', () => {
  const profilesRepo = {
    createQueryBuilder: jest.fn(),
  };

  const friendshipsRepo = {
    createQueryBuilder: jest.fn(),
  };

  let service: UserSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserSearchService(profilesRepo as any, friendshipsRepo as any);
  });

  it('rejects name search shorter than 2 characters', async () => {
    await expect(service.search('viewer-id', 'a')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('searches username exactly when handle is valid', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          userId: 'target-id',
          firstName: 'Ada',
          lastName: null,
          username: 'ada_lift',
          avatarUrl: null,
        },
      ]),
    };
    profilesRepo.createQueryBuilder.mockReturnValue(qb);
    friendshipsRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const results = await service.search('viewer-id', '@ada_lift');
    expect(results).toHaveLength(1);
    expect(results[0]?.username).toBe('ada_lift');
    expect(qb.andWhere).toHaveBeenCalledWith(
      'LOWER(p.username) = :username',
      { username: 'ada_lift' },
    );
  });
});
