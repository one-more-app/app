import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { FriendshipStatus } from '../social/entities/friendship-status.enum.js';
import {
  UserBadgeEntity,
  type RankingGymBadgeTier,
  type UserBadgeKind,
} from './entities/user-badge.entity.js';
import {
  rankingGymDeeplink,
  rankingGymTierFromRank,
} from './lib/ranking-gym-tier.js';

export type UserBadgeDto = {
  id: string;
  kind: UserBadgeKind;
  tier: string;
  sourceKey: string;
  earnedAt: string;
  meta: Record<string, unknown>;
  deeplink: string | null;
};

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(UserBadgeEntity)
    private readonly badgesRepo: Repository<UserBadgeEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
  ) {}

  async listForUser(userId: string): Promise<UserBadgeDto[]> {
    const rows = await this.badgesRepo.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  /** Badges d’un ami accepté (profil public entre potes). */
  async listForFriend(
    viewerId: string,
    targetUserId: string,
  ): Promise<UserBadgeDto[]> {
    if (viewerId === targetUserId) {
      return this.listForUser(viewerId);
    }
    const friendship = await this.friendshipsRepo.findOne({
      where: [
        {
          requesterId: viewerId,
          addresseeId: targetUserId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requesterId: targetUserId,
          addresseeId: viewerId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });
    if (!friendship) {
      throw new ForbiddenException('Profil réservé aux amis.');
    }
    return this.listForUser(targetUserId);
  }

  /**
   * Crée (idempotent) un badge classement salle pour un mois clos.
   * Retourne le badge si le rang est éligible, sinon null.
   */
  async ensureRankingGymBadge(params: {
    userId: string;
    month: string;
    rank: number;
    placeId?: string | null;
    placeName?: string | null;
  }): Promise<UserBadgeDto | null> {
    const tier = rankingGymTierFromRank(params.rank);
    if (!tier) return null;

    const sourceKey = params.month;
    const existing = await this.badgesRepo.findOne({
      where: {
        userId: params.userId,
        kind: 'ranking_gym',
        sourceKey,
      },
    });
    if (existing) {
      // Met à jour deeplink / meta placeId si manquant
      const placeId =
        params.placeId ??
        (typeof existing.meta?.placeId === 'string'
          ? existing.meta.placeId
          : null);
      const needsUpdate =
        Boolean(placeId) &&
        (existing.deeplink !== rankingGymDeeplink(params.month, placeId) ||
          existing.meta?.placeId !== placeId);
      if (needsUpdate && placeId) {
        existing.meta = {
          ...existing.meta,
          placeId,
          placeName: params.placeName ?? existing.meta?.placeName ?? null,
        };
        existing.deeplink = rankingGymDeeplink(params.month, placeId);
        return this.toDto(await this.badgesRepo.save(existing));
      }
      return this.toDto(existing);
    }

    const earnedAt = this.monthEndDate(params.month);
    const row = this.badgesRepo.create({
      userId: params.userId,
      kind: 'ranking_gym',
      tier,
      sourceKey,
      earnedAt,
      meta: {
        month: params.month,
        rank: params.rank,
        placeId: params.placeId ?? null,
        placeName: params.placeName ?? null,
        tier: tier as RankingGymBadgeTier,
      },
      deeplink: rankingGymDeeplink(params.month, params.placeId),
    });

    try {
      const saved = await this.badgesRepo.save(row);
      return this.toDto(saved);
    } catch {
      const again = await this.badgesRepo.findOne({
        where: {
          userId: params.userId,
          kind: 'ranking_gym',
          sourceKey,
        },
      });
      return again ? this.toDto(again) : null;
    }
  }

  private monthEndDate(month: string): Date {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y!, m!, 0, 23, 59, 59, 999));
  }

  private toDto(row: UserBadgeEntity): UserBadgeDto {
    const meta = row.meta ?? {};
    const placeId =
      typeof meta.placeId === 'string' && meta.placeId.trim()
        ? meta.placeId
        : null;
    return {
      id: row.id,
      kind: row.kind,
      tier: row.tier,
      sourceKey: row.sourceKey,
      earnedAt: row.earnedAt.toISOString(),
      meta,
      deeplink:
        row.kind === 'ranking_gym'
          ? rankingGymDeeplink(row.sourceKey, placeId)
          : row.deeplink,
    };
  }
}
