import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';
import { isValidUsername, normalizeUsername } from './lib/username.js';

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
    const q = rawQuery.trim();
    if (q.length < 1) {
      throw new BadRequestException('Requête de recherche vide');
    }

    const handleQuery = q.startsWith('@') ? normalizeUsername(q) : null;
    const asHandle =
      handleQuery && isValidUsername(handleQuery)
        ? handleQuery
        : isValidUsername(normalizeUsername(q))
          ? normalizeUsername(q)
          : null;

    let profiles: UserProfileEntity[];

    if (asHandle) {
      profiles = await this.profilesRepo
        .createQueryBuilder('p')
        .where('p.userId != :viewerId', { viewerId })
        .andWhere('LOWER(p.username) = :username', { username: asHandle })
        .limit(20)
        .getMany();
    } else {
      if (q.length < 2) {
        throw new BadRequestException(
          'Saisis au moins 2 caractères pour une recherche par nom',
        );
      }
      const pattern = `%${q.replace(/[%_]/g, '')}%`;
      profiles = await this.profilesRepo
        .createQueryBuilder('p')
        .where('p.userId != :viewerId', { viewerId })
        .andWhere(
          new Brackets((qb) => {
            qb.where('p.firstName ILIKE :pattern', { pattern }).orWhere(
              'p.lastName ILIKE :pattern',
              { pattern },
            );
          }),
        )
        .limit(20)
        .getMany();
    }

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
