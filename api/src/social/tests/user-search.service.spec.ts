import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { UserSearchService } from '../user-search.service.js';

describe('UserSearchService', () => {
  let profilesRepo: { createQueryBuilder: jest.Mock };
  let friendshipsRepo: { createQueryBuilder: jest.Mock };

  let service: UserSearchService;
  let qb: {
    where: jest.Mock;
    andWhere: jest.Mock;
    setParameters: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    limit: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    profilesRepo = {
      createQueryBuilder: jest.fn(),
    };
    friendshipsRepo = {
      createQueryBuilder: jest.fn(),
    };

    service = new UserSearchService(profilesRepo as any, friendshipsRepo as any);

    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    profilesRepo.createQueryBuilder.mockReturnValue(qb);
    friendshipsRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
  });

  it('rejects name search shorter than 2 characters', async () => {
    await expect(service.search('viewer-id', 'a')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('searches username partially when query starts with @', async () => {
    qb.getMany.mockResolvedValue([
      {
        userId: 'target-id',
        firstName: 'Ada',
        lastName: null,
        username: 'ada_lift',
        avatarUrl: null,
      },
    ]);

    const results = await service.search('viewer-id', '@ada');
    expect(results).toHaveLength(1);
    expect(results[0]?.username).toBe('ada_lift');
    expect(qb.andWhere).toHaveBeenCalledWith(
      "unaccent(COALESCE(LOWER(p.username), '')) ILIKE unaccent(:handlePattern)",
    );
    expect(qb.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        handlePattern: '%ada%',
        rankExact: 'ada',
      }),
    );
  });

  it('uses multi-field partial search for names without @ prefix', async () => {
    await service.search('viewer-id', 'Jean');

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'LOWER(p.username) = :username',
      expect.anything(),
    );
    expect(qb.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        token0: '%Jean%',
        rankExact: 'jean',
      }),
    );
  });

  it('adds one AND clause per token for full-name search', async () => {
    await service.search('viewer-id', 'Jean Dupont');

    const andWhereCalls = qb.andWhere.mock.calls.filter(
      ([arg]) => typeof arg !== 'string',
    );
    expect(andWhereCalls).toHaveLength(2);
    expect(qb.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        token0: '%Jean%',
        token1: '%Dupont%',
      }),
    );
  });

  it('allows single character after @ in handle mode', async () => {
    await service.search('viewer-id', '@a');

    expect(qb.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        handlePattern: '%a%',
      }),
    );
  });

  it('orders results by relevance', async () => {
    await service.search('viewer-id', 'marie');

    expect(qb.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('CASE'),
      'ASC',
    );
    expect(qb.limit).toHaveBeenCalledWith(20);
  });

  it('requires discoverableByUsername in handle mode', async () => {
    await service.search('viewer-id', '@ada');

    expect(qb.andWhere).toHaveBeenCalledWith('p.discoverableByUsername = true');
  });
});
