import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { LeagueService } from '../league/league.service.js';
import { UserGymEntity } from '../gyms/entities/user-gym.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { getAcceptedFriendIds } from '../social/lib/accepted-friend-ids.js';
import type {
  RankingEntryDto,
  RankingListResponse,
  RankingRecapResponse,
} from './dto/ranking-response.dto.js';
import { monthActivityDateBounds } from './lib/month-bounds.js';
import { withRanks, type XpAggRow } from './lib/rank-entries.js';

export const GYM_RANKING_MAX_ENTRIES = 100;
/** Plafond de la liste amis (même soft cap que la salle). */
export const FRIENDS_RANKING_MAX_ENTRIES = GYM_RANKING_MAX_ENTRIES;

type BuildOptions = {
  limit?: number;
  listEntries?: boolean;
  /** Enrichit avec le rang de ligue global (défaut true). */
  withGlobalRank?: boolean;
};

type RankingComputation = {
  entries: RankingEntryDto[];
  me: RankingListResponse['me'];
  /** Nombre total de participants avant plafonnement de la liste. */
  total: number;
};

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(XpEventEntity)
    private readonly xpRepo: Repository<XpEventEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    @InjectRepository(UserGymEntity)
    private readonly userGymsRepo: Repository<UserGymEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly leagueService: LeagueService,
  ) {}

  async listFriendsRanking(
    viewerId: string,
    month: string,
    options: { lite?: boolean } = {},
  ): Promise<RankingListResponse> {
    const { entries, me, total } = await this.computeFriends(viewerId, month, {
      withGlobalRank: !options.lite,
    });
    return { month, entries, me, total };
  }

  async listGymRanking(
    viewerId: string,
    month: string,
  ): Promise<RankingListResponse> {
    const { result, meta } = await this.computeGym(viewerId, month);
    return {
      month,
      entries: result.entries,
      me: result.me,
      meta,
    };
  }

  async recap(viewerId: string, month: string): Promise<RankingRecapResponse> {
    const bounds = monthActivityDateBounds(month);
    const raw = await this.xpRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'xp')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN e.amount > 0 THEN e.activityDate END)',
        'activeDays',
      )
      .where('e.userId = :viewerId', { viewerId })
      .andWhere('e.activityDate >= :start', { start: bounds.start })
      .andWhere('e.activityDate <= :end', { end: bounds.end })
      .getRawOne<{ xp: string | null; activeDays: string | null }>();

    // Recap : rang + total uniquement, sans badges de ligue ni liste.
    const friends = await this.computeFriends(viewerId, month, {
      withGlobalRank: false,
      listEntries: false,
    });
    const gym = await this.computeGym(viewerId, month, {
      withGlobalRank: false,
      listEntries: false,
    });

    return {
      month,
      xp: Number(raw?.xp ?? 0),
      activeDays: Number(raw?.activeDays ?? 0),
      friends: { rank: friends.me.rank, total: friends.total },
      gym: gym.meta.rankingOptIn
        ? { rank: gym.result.me.rank, total: gym.result.total }
        : null,
    };
  }

  private async computeFriends(
    viewerId: string,
    month: string,
    options: BuildOptions = {},
  ): Promise<RankingComputation> {
    const friendIds = await getAcceptedFriendIds(
      this.friendshipsRepo,
      viewerId,
    );
    return this.buildForUserIds(viewerId, [viewerId, ...friendIds], month, {
      limit: FRIENDS_RANKING_MAX_ENTRIES,
      ...options,
    });
  }

  private async computeGym(
    viewerId: string,
    month: string,
    options: Pick<BuildOptions, 'withGlobalRank' | 'listEntries'> = {},
  ): Promise<{
    result: RankingComputation;
    meta: NonNullable<RankingListResponse['meta']>;
  }> {
    const viewerGym = await this.userGymsRepo.findOne({
      where: { userId: viewerId },
    });

    if (!viewerGym || !viewerGym.rankingOptIn) {
      // Ne pas exposer la liste : seulement le score personnel.
      const result = await this.buildForUserIds(viewerId, [viewerId], month, {
        ...options,
        listEntries: false,
      });
      return {
        result,
        meta: {
          hasGym: !!viewerGym,
          rankingOptIn: false,
          placeName: viewerGym?.name ?? null,
        },
      };
    }

    const members = await this.userGymsRepo.find({
      where: { placeId: viewerGym.placeId, rankingOptIn: true },
    });
    const ids = [viewerId, ...members.map((m) => m.userId)];
    const result = await this.buildForUserIds(viewerId, ids, month, {
      limit: GYM_RANKING_MAX_ENTRIES,
      ...options,
    });
    return {
      result,
      meta: {
        hasGym: true,
        rankingOptIn: true,
        placeName: viewerGym.name,
      },
    };
  }

  private async buildForUserIds(
    viewerId: string,
    candidateIds: string[],
    month: string,
    options: BuildOptions = {},
  ): Promise<RankingComputation> {
    const bounds = monthActivityDateBounds(month);

    const activeUsers = await this.usersRepo.find({
      where: { id: In([...new Set(candidateIds)]), deletedAt: IsNull() },
      select: ['id'],
    });
    const ids = [...new Set([viewerId, ...activeUsers.map((u) => u.id)])];

    const raw = await this.xpRepo
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .addSelect('SUM(e.amount)', 'xp')
      .addSelect('MAX(e.earnedAt)', 'lastEarnedAt')
      .where('e.userId IN (:...ids)', { ids })
      .andWhere('e.activityDate >= :start', { start: bounds.start })
      .andWhere('e.activityDate <= :end', { end: bounds.end })
      .groupBy('e.userId')
      .getRawMany<{
        userId: string;
        xp: string | number;
        lastEarnedAt: Date | string | null;
      }>();

    const byUser = new Map(raw.map((r) => [r.userId, r]));
    const rows: XpAggRow[] = ids.map((userId) => {
      const r = byUser.get(userId);
      return {
        userId,
        xp: Number(r?.xp ?? 0),
        lastEarnedAt: r?.lastEarnedAt ? new Date(r.lastEarnedAt) : null,
      };
    });

    const ranked = withRanks(rows);
    const meRow = ranked.find((r) => r.userId === viewerId)!;

    const listed =
      options.listEntries === false
        ? []
        : options.limit
          ? ranked.slice(0, options.limit)
          : ranked;

    const profileIds = [...new Set([...listed.map((r) => r.userId), viewerId])];
    const profiles =
      listed.length > 0
        ? await this.profilesRepo.find({ where: { userId: In(profileIds) } })
        : [];
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    const globalRankByUser = new Map<string, string | null>();
    if (options.withGlobalRank !== false) {
      await Promise.all(
        profileIds.map(async (userId) => {
          const summary = await this.leagueService.buildSummary(userId);
          globalRankByUser.set(userId, summary?.globalRank ?? null);
        }),
      );
    }

    const entries: RankingEntryDto[] = listed.map((r) => {
      const profile = profileByUser.get(r.userId);
      return {
        userId: r.userId,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        xp: r.xp,
        rank: r.rank,
        globalRank: globalRankByUser.get(r.userId) ?? null,
      };
    });

    return {
      entries,
      me: {
        userId: viewerId,
        xp: meRow.xp,
        rank: meRow.rank,
        globalRank: globalRankByUser.get(viewerId) ?? null,
      },
      total: ranked.length,
    };
  }
}
