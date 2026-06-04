import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';
import {
  parseSearchInput,
  toIlikeContainsPattern,
} from './lib/user-search-query.js';

export type UserSearchResult = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  friendshipStatus: FriendshipStatus | null;
  friendshipId: string | null;
  friendshipDirection: 'incoming' | 'outgoing' | null;
};

@Injectable()
export class UserSearchService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
  ) {}

  async search(viewerId: string, rawQuery: string): Promise<UserSearchResult[]> {
    const parsed = parseSearchInput(rawQuery);
    if ('error' in parsed) {
      throw new BadRequestException(parsed.error);
    }

    const qb = this.profilesRepo
      .createQueryBuilder('p')
      .where('p.userId != :viewerId', { viewerId });

    const params: Record<string, string> = { viewerId };

    if (parsed.mode === 'handle') {
      params.handlePattern = toIlikeContainsPattern(parsed.handle!);
      qb.andWhere('p.discoverableByUsername = true')
        .andWhere('p.username IS NOT NULL')
        .andWhere(
          "unaccent(COALESCE(LOWER(p.username), '')) ILIKE unaccent(:handlePattern)",
        );
    } else {
      parsed.tokens.forEach((token, index) => {
        const paramKey = `token${index}`;
        params[paramKey] = toIlikeContainsPattern(token);
        qb.andWhere(
          new Brackets((tokenMatch) => {
            tokenMatch
              .where(
                new Brackets((nameMatch) => {
                  nameMatch
                    .where('p.searchableByName = true')
                    .andWhere(
                      new Brackets((nameFields) => {
                        nameFields
                          .where(
                            `unaccent(COALESCE(p."firstName", '')) ILIKE unaccent(:${paramKey})`,
                          )
                          .orWhere(
                            `unaccent(COALESCE(p."lastName", '')) ILIKE unaccent(:${paramKey})`,
                          )
                          .orWhere(
                            `unaccent(COALESCE(p."firstName", '') || ' ' || COALESCE(p."lastName", '')) ILIKE unaccent(:${paramKey})`,
                          );
                      }),
                    );
                }),
              )
              .orWhere(
                new Brackets((usernameMatch) => {
                  usernameMatch
                    .where('p.discoverableByUsername = true')
                    .andWhere('p.username IS NOT NULL')
                    .andWhere(
                      `unaccent(COALESCE(LOWER(p.username), '')) ILIKE unaccent(:${paramKey})`,
                    );
                }),
              );
          }),
        );
      });
    }

    const rankTerm = (parsed.handle ?? parsed.tokens[0] ?? '').toLowerCase();
    params.rankExact = rankTerm;
    params.rankPrefix = rankTerm;

    qb.setParameters(params)
      .orderBy(
        `(CASE
          WHEN p.discoverableByUsername = true AND LOWER(p.username) = :rankExact THEN 0
          WHEN p.discoverableByUsername = true AND unaccent(COALESCE(LOWER(p.username), '')) ILIKE unaccent(:rankPrefix) || '%' THEN 1
          WHEN p.searchableByName = true AND (
            unaccent(COALESCE(p."firstName", '')) ILIKE unaccent(:rankPrefix) || '%'
            OR unaccent(COALESCE(p."lastName", '')) ILIKE unaccent(:rankPrefix) || '%'
          ) THEN 2
          ELSE 3
        END)`,
        'ASC',
      )
      .addOrderBy('p.firstName', 'ASC', 'NULLS LAST')
      .addOrderBy('p.lastName', 'ASC', 'NULLS LAST')
      .limit(20);

    const profiles = await qb.getMany();

    if (profiles.length === 0) return [];

    const userIds = profiles.map((p) => p.userId);
    const friendships = await this.friendshipsRepo
      .createQueryBuilder('f')
      .where(
        '(f.requesterId = :viewerId AND f.addresseeId IN (:...userIds)) OR (f.addresseeId = :viewerId AND f.requesterId IN (:...userIds))',
        { viewerId, userIds },
      )
      .getMany();

    const friendshipByOther = new Map<
      string,
      { friendship: FriendshipEntity; direction: 'incoming' | 'outgoing' }
    >();
    for (const f of friendships) {
      const otherId =
        f.requesterId === viewerId ? f.addresseeId : f.requesterId;
      friendshipByOther.set(otherId, {
        friendship: f,
        direction: f.requesterId === viewerId ? 'outgoing' : 'incoming',
      });
    }

    return profiles
      .filter((p) => {
        const rel = friendshipByOther.get(p.userId);
        if (!rel) return true;
        return rel.friendship.status !== FriendshipStatus.BLOCKED;
      })
      .map((p) => {
        const rel = friendshipByOther.get(p.userId);
        return {
          userId: p.userId,
          firstName: p.firstName,
          lastName: p.lastName,
          username: p.username,
          avatarUrl: p.avatarUrl,
          friendshipStatus: rel?.friendship.status ?? null,
          friendshipId: rel?.friendship.id ?? null,
          friendshipDirection: rel?.direction ?? null,
        };
      });
  }
}
