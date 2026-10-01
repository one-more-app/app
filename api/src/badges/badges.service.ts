import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async listForUser(userId: string): Promise<UserBadgeDto[]> {
    const rows = await this.badgesRepo.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
    return rows.map((r) => this.toDto(r));
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
    if (existing) return this.toDto(existing);

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
      deeplink: rankingGymDeeplink(params.month),
    });

    try {
      const saved = await this.badgesRepo.save(row);
      return this.toDto(saved);
    } catch {
      // Course : un autre insert a gagné
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
    // Dernier jour du mois UTC 23:59
    return new Date(Date.UTC(y!, m!, 0, 23, 59, 59, 999));
  }

  private toDto(row: UserBadgeEntity): UserBadgeDto {
    return {
      id: row.id,
      kind: row.kind,
      tier: row.tier,
      sourceKey: row.sourceKey,
      earnedAt: row.earnedAt.toISOString(),
      meta: row.meta ?? {},
      deeplink: row.deeplink,
    };
  }
}
