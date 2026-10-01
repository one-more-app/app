import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { BadgesService } from '../badges/badges.service.js';
import { LeagueService } from '../league/league.service.js';
import { UserGymEntity } from '../gyms/entities/user-gym.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { getAcceptedFriendIds } from '../social/lib/accepted-friend-ids.js';
import { loadPremiumByUserIds } from '../social/lib/premium-by-user-id.js';
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
    private readonly badgesService: BadgesService,
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
    placeId?: string | null,
  ): Promise<RankingListResponse> {
    const { result, meta } = await this.computeGym(viewerId, month, {}, placeId);
    return {
      month,
      entries: result.entries,
      me: result.me,
      total: result.total,
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

    const gymPayload = gym.meta.rankingOptIn
      ? { rank: gym.result.me.rank, total: gym.result.total }
      : null;

    let badge: RankingRecapResponse['badge'] = null;
    if (gymPayload && this.isClosedMonth(month)) {
      const awarded = await this.badgesService.ensureRankingGymBadge({
        userId: viewerId,
        month,
        rank: gymPayload.rank,
        placeId: gym.meta.placeId ?? null,
        placeName: gym.meta.placeName ?? null,
      });
      if (awarded) {
        badge = {
          kind: awarded.kind,
          tier: awarded.tier,
          deeplink: awarded.deeplink,
        };
      }
    }

    return {
      month,
      xp: Number(raw?.xp ?? 0),
      activeDays: Number(raw?.activeDays ?? 0),
      friends: { rank: friends.me.rank, total: friends.total },
      gym: gymPayload,
      badge,
    };
  }

  /** Mois strictement antérieur au mois UTC courant. */
  private isClosedMonth(month: string): boolean {
    const now = new Date();
    const current = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return month < current;
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
    placeIdOverride?: string | null,
  ): Promise<{
    result: RankingComputation;
    meta: NonNullable<RankingListResponse['meta']>;
  }> {
    const viewerGym = await this.userGymsRepo.findOne({
      where: { userId: viewerId },
    });

    const targetPlaceId = placeIdOverride?.trim() || null;
    const foreignGym =
      Boolean(targetPlaceId) &&
      (!viewerGym || viewerGym.placeId !== targetPlaceId);

    // Consultation d’une salle (deeplink badge) : liste des opt-in de ce placeId.
    if (targetPlaceId && foreignGym) {
      const members = await this.userGymsRepo.find({
        where: { placeId: targetPlaceId, rankingOptIn: true },
      });
      const sample =
        members[0] ??
        (await this.userGymsRepo.findOne({ where: { placeId: targetPlaceId } }));
      const ids = members.map((m) => m.userId);
      const result = await this.buildForUserIds(
        viewerId,
        ids.length > 0 ? ids : [],
        month,
        {
          ...options,
          limit: GYM_RANKING_MAX_ENTRIES,
          // Viewer hors salle : ne pas l’injecter dans le pool.
          forceIncludeViewer: false,
        },
      );
      return {
        result,
        meta: {
          hasGym: true,
          rankingOptIn: false,
          placeId: targetPlaceId,
          placeName: sample?.name ?? null,
          placeAddress: sample?.address ?? null,
          foreignGym: true,
        },
      };
    }

    if (!viewerGym || !viewerGym.rankingOptIn) {
      const result = await this.buildForUserIds(viewerId, [viewerId], month, {
        ...options,
        listEntries: false,
      });
      return {
        result,
        meta: {
          hasGym: !!viewerGym,
          rankingOptIn: false,
          placeId: viewerGym?.placeId ?? null,
          placeName: viewerGym?.name ?? null,
          placeAddress: viewerGym?.address ?? null,
          foreignGym: false,
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
        placeId: viewerGym.placeId,
        placeName: viewerGym.name,
        placeAddress: viewerGym.address ?? null,
        foreignGym: false,
      },
    };
  }

  private async buildForUserIds(
    viewerId: string,
    candidateIds: string[],
    month: string,
    options: BuildOptions & { forceIncludeViewer?: boolean } = {},
  ): Promise<RankingComputation> {
    const bounds = monthActivityDateBounds(month);
    const forceIncludeViewer = options.forceIncludeViewer !== false;

    const uniqueCandidates = [...new Set(candidateIds)];
    const activeUsers =
      uniqueCandidates.length > 0
        ? await this.usersRepo.find({
            where: { id: In(uniqueCandidates), deletedAt: IsNull() },
            select: ['id'],
          })
        : [];
    let ids = activeUsers.map((u) => u.id);
    if (forceIncludeViewer && !ids.includes(viewerId)) {
      ids = [viewerId, ...ids];
    }

    if (ids.length === 0) {
      return {
        entries: [],
        me: {
          userId: viewerId,
          xp: 0,
          rank: 0,
          globalRank: null,
        },
        total: 0,
      };
    }

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
    const meRow = ranked.find((r) => r.userId === viewerId);

    const listed =
      options.listEntries === false
        ? []
        : options.limit
          ? ranked.slice(0, options.limit)
          : ranked;

    const profileIds = [
      ...new Set([
        ...listed.map((r) => r.userId),
        ...(meRow ? [viewerId] : []),
      ]),
    ];
    const profiles =
      profileIds.length > 0
        ? await this.profilesRepo.find({ where: { userId: In(profileIds) } })
        : [];
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    const globalRankByUser = new Map<string, string | null>();
    if (options.withGlobalRank !== false && profileIds.length > 0) {
      await Promise.all(
        profileIds.map(async (userId) => {
          const summary = await this.leagueService.buildSummary(userId);
          globalRankByUser.set(userId, summary?.globalRank ?? null);
        }),
      );
    }

    const premiumByUserId = await loadPremiumByUserIds(
      this.usersRepo,
      profileIds,
    );

    const entries: RankingEntryDto[] = listed.map((r) => {
      const profile = profileByUser.get(r.userId);
      return {
        userId: r.userId,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        xp: r.xp,
        rank: r.rank,
        globalRank: globalRankByUser.get(r.userId) ?? null,
        isPremium: premiumByUserId.get(r.userId) ?? false,
      };
    });

    return {
      entries,
      me: meRow
        ? {
            userId: viewerId,
            xp: meRow.xp,
            rank: meRow.rank,
            globalRank: globalRankByUser.get(viewerId) ?? null,
          }
        : {
            userId: viewerId,
            xp: 0,
            rank: 0,
            globalRank: null,
          },
      total: ranked.length,
    };
  }
}
