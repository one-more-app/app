import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RankingService } from '../ranking.service.js';

type RawRow = { userId: string; xp: string; lastEarnedAt: Date | string };

function makeQb(opts: { rawMany?: unknown[]; rawOne?: unknown }) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['select', 'addSelect', 'where', 'andWhere', 'groupBy']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(opts.rawMany ?? []);
  qb.getRawOne = jest.fn().mockResolvedValue(opts.rawOne ?? null);
  return qb;
}

describe('RankingService', () => {
  const xpRepo = { createQueryBuilder: jest.fn() };
  const friendshipsRepo = { find: jest.fn() };
  const userGymsRepo = { findOne: jest.fn(), find: jest.fn() };
  const profilesRepo = { find: jest.fn() };
  const usersRepo = { find: jest.fn() };
  const leagueService = { buildSummary: jest.fn() };

  let service: RankingService;

  const accepted = (requesterId: string, addresseeId: string) => ({
    requesterId,
    addresseeId,
    status: 'accepted',
  });

  beforeEach(() => {
    jest.resetAllMocks();
    profilesRepo.find.mockImplementation(async (args: any) =>
      (args.where.userId.value as string[]).map((userId) => ({
        userId,
        username: `name-${userId}`,
        avatarUrl: null,
      })),
    );
    usersRepo.find.mockImplementation(async (args: any) =>
      (args.where.id.value as string[]).map((id) => ({ id })),
    );
    leagueService.buildSummary.mockResolvedValue({ globalRank: 'silver' });
    service = new RankingService(
      xpRepo as any,
      friendshipsRepo as any,
      userGymsRepo as any,
      profilesRepo as any,
      usersRepo as any,
      leagueService as any,
    );
  });

  describe('listFriendsRanking', () => {
    it('includes only accepted friends + viewer and excludes soft-deleted users', async () => {
      friendshipsRepo.find.mockResolvedValue([
        accepted('me', 'f1'),
        accepted('f2', 'me'),
        accepted('me', 'deleted'),
      ]);
      usersRepo.find.mockImplementation(async (args: any) =>
        (args.where.id.value as string[])
          .filter((id) => id !== 'deleted')
          .map((id) => ({ id })),
      );
      const qb = makeQb({
        rawMany: [
          { userId: 'f1', xp: '300', lastEarnedAt: new Date('2026-09-10') },
          { userId: 'me', xp: '100', lastEarnedAt: new Date('2026-09-11') },
        ],
      });
      xpRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.listFriendsRanking('me', '2026-09');

      const idsArg = qb.where.mock.calls[0][1] as { ids: string[] };
      expect([...idsArg.ids].sort()).toEqual(['f1', 'f2', 'me']);
      expect(res.month).toBe('2026-09');
      expect(res.entries.map((e) => e.userId)).toEqual(['f1', 'me', 'f2']);
      expect(res.entries.map((e) => e.rank)).toEqual([1, 2, 3]);
      expect(res.entries[2].xp).toBe(0);
      expect(res.entries[0]).toMatchObject({
        username: 'name-f1',
        avatarUrl: null,
        globalRank: 'silver',
      });
      expect(res.me).toMatchObject({ userId: 'me', xp: 100, rank: 2 });
    });

    it('sums XP over the month bounds', async () => {
      friendshipsRepo.find.mockResolvedValue([]);
      const qb = makeQb({
        rawMany: [{ userId: 'me', xp: '42', lastEarnedAt: new Date() }],
      });
      xpRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.listFriendsRanking('me', '2026-02');

      expect(qb.andWhere).toHaveBeenCalledWith('e.activityDate >= :start', {
        start: '2026-02-01',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('e.activityDate <= :end', {
        end: '2026-02-28',
      });
      expect(qb.addSelect).toHaveBeenCalledWith('SUM(e.amount)', 'xp');
      expect(res.me.xp).toBe(42);
    });
  });

  describe('listGymRanking', () => {
    it('returns empty entries with hasGym=false when viewer has no gym', async () => {
      userGymsRepo.findOne.mockResolvedValue(null);
      xpRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          rawMany: [{ userId: 'me', xp: '5', lastEarnedAt: new Date() }],
        }),
      );

      const res = await service.listGymRanking('me', '2026-09');

      expect(res.entries).toEqual([]);
      expect(res.meta).toEqual({
        hasGym: false,
        rankingOptIn: false,
        placeName: null,
      });
      expect(res.me.userId).toBe('me');
      expect(userGymsRepo.find).not.toHaveBeenCalled();
    });

    it('returns empty entries without leaking list when viewer not opted in', async () => {
      userGymsRepo.findOne.mockResolvedValue({
        userId: 'me',
        placeId: 'p1',
        name: 'Gym',
        rankingOptIn: false,
      });
      xpRepo.createQueryBuilder.mockReturnValue(makeQb({ rawMany: [] }));

      const res = await service.listGymRanking('me', '2026-09');

      expect(res.entries).toEqual([]);
      expect(res.meta).toMatchObject({
        hasGym: true,
        rankingOptIn: false,
        placeName: 'Gym',
      });
      expect(userGymsRepo.find).not.toHaveBeenCalled();
    });

    it('lists only opted-in members of the same placeId', async () => {
      userGymsRepo.findOne.mockResolvedValue({
        userId: 'me',
        placeId: 'p1',
        name: 'Gym',
        rankingOptIn: true,
      });
      userGymsRepo.find.mockResolvedValue([{ userId: 'me' }, { userId: 'g1' }]);
      const qb = makeQb({
        rawMany: [
          { userId: 'g1', xp: '50', lastEarnedAt: new Date('2026-09-01') },
          { userId: 'me', xp: '60', lastEarnedAt: new Date('2026-09-02') },
        ],
      });
      xpRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.listGymRanking('me', '2026-09');

      const where = userGymsRepo.find.mock.calls[0][0] as any;
      expect(where.where).toEqual({ placeId: 'p1', rankingOptIn: true });
      expect(res.entries.map((e) => e.userId)).toEqual(['me', 'g1']);
      expect(res.meta).toMatchObject({ hasGym: true, rankingOptIn: true });
      expect(res.me.rank).toBe(1);
    });

    it('caps entries at 100 but keeps accurate me rank', async () => {
      userGymsRepo.findOne.mockResolvedValue({
        userId: 'me',
        placeId: 'p1',
        name: 'Gym',
        rankingOptIn: true,
      });
      const others = Array.from({ length: 120 }, (_, i) => `u${i}`);
      userGymsRepo.find.mockResolvedValue(
        ['me', ...others].map((userId) => ({ userId })),
      );
      const rows: RawRow[] = others.map((userId, i) => ({
        userId,
        xp: String(1000 - i),
        lastEarnedAt: new Date('2026-09-01'),
      }));
      rows.push({
        userId: 'me',
        xp: '1',
        lastEarnedAt: new Date('2026-09-01'),
      });
      xpRepo.createQueryBuilder.mockReturnValue(makeQb({ rawMany: rows }));

      const res = await service.listGymRanking('me', '2026-09');

      expect(res.entries).toHaveLength(100);
      expect(res.entries.find((e) => e.userId === 'me')).toBeUndefined();
      expect(res.me.rank).toBe(121);
    });
  });

  describe('recap', () => {
    it('returns activeDays from distinct activityDate with XP > 0 and ranks', async () => {
      friendshipsRepo.find.mockResolvedValue([accepted('me', 'f1')]);
      userGymsRepo.findOne.mockResolvedValue(null);
      const listQb = makeQb({
        rawMany: [
          { userId: 'f1', xp: '10', lastEarnedAt: new Date('2026-09-01') },
          { userId: 'me', xp: '20', lastEarnedAt: new Date('2026-09-02') },
        ],
      });
      const recapQb = makeQb({ rawOne: { xp: '20', activeDays: '3' } });
      xpRepo.createQueryBuilder
        .mockReturnValueOnce(recapQb)
        .mockReturnValue(listQb);

      const res = await service.recap('me', '2026-09');

      expect(recapQb.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT'),
        'activeDays',
      );
      expect(res).toEqual({
        month: '2026-09',
        xp: 20,
        activeDays: 3,
        friends: { rank: 1, total: 2 },
        gym: null,
      });
    });

    it('includes gym rank only when opted in', async () => {
      friendshipsRepo.find.mockResolvedValue([]);
      userGymsRepo.findOne.mockResolvedValue({
        userId: 'me',
        placeId: 'p1',
        name: 'Gym',
        rankingOptIn: true,
      });
      userGymsRepo.find.mockResolvedValue([{ userId: 'me' }, { userId: 'g1' }]);
      const recapQb = makeQb({ rawOne: { xp: '5', activeDays: '1' } });
      const listQb = makeQb({
        rawMany: [
          { userId: 'g1', xp: '9', lastEarnedAt: new Date('2026-09-01') },
          { userId: 'me', xp: '5', lastEarnedAt: new Date('2026-09-01') },
        ],
      });
      xpRepo.createQueryBuilder
        .mockReturnValueOnce(recapQb)
        .mockReturnValue(listQb);

      const res = await service.recap('me', '2026-09');

      expect(res.gym).toEqual({ rank: 2, total: 2 });
      expect(res.friends).toEqual({ rank: 1, total: 1 });
    });
  });
});
