import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserGymEntity } from '../gyms/entities/user-gym.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';
import { getAcceptedFriendIds } from './lib/accepted-friend-ids.js';
import { loadPremiumByUserIds } from './lib/premium-by-user-id.js';

export type FriendSuggestionReason = 'mutual_friends' | 'same_gym';

export type FriendSuggestion = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  isPremium: boolean;
  reasons: FriendSuggestionReason[];
  mutualFriendsCount: number;
};

const SUGGESTIONS_LIMIT = 15;

type CandidateAccum = {
  mutualFriendsCount: number;
  sameGym: boolean;
};

/** Rank: combo > FoF (by count) > gym-only. Exported for unit tests. */
export function rankFriendSuggestionCandidates(
  candidates: Map<string, CandidateAccum>,
): Array<{ userId: string; mutualFriendsCount: number; sameGym: boolean }> {
  return [...candidates.entries()]
    .map(([userId, c]) => ({
      userId,
      mutualFriendsCount: c.mutualFriendsCount,
      sameGym: c.sameGym,
    }))
    .sort((a, b) => {
      const aCombo = a.mutualFriendsCount > 0 && a.sameGym ? 1 : 0;
      const bCombo = b.mutualFriendsCount > 0 && b.sameGym ? 1 : 0;
      if (bCombo !== aCombo) return bCombo - aCombo;

      const aFof = a.mutualFriendsCount > 0 ? 1 : 0;
      const bFof = b.mutualFriendsCount > 0 ? 1 : 0;
      if (bFof !== aFof) return bFof - aFof;

      if (b.mutualFriendsCount !== a.mutualFriendsCount) {
        return b.mutualFriendsCount - a.mutualFriendsCount;
      }

      return a.userId.localeCompare(b.userId);
    });
}

export function buildSuggestionReasons(
  mutualFriendsCount: number,
  sameGym: boolean,
): FriendSuggestionReason[] {
  const reasons: FriendSuggestionReason[] = [];
  if (mutualFriendsCount > 0) reasons.push('mutual_friends');
  if (sameGym) reasons.push('same_gym');
  return reasons;
}

@Injectable()
export class FriendSuggestionsService {
  constructor(
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(UserGymEntity)
    private readonly gymsRepo: Repository<UserGymEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async suggest(viewerId: string): Promise<FriendSuggestion[]> {
    const excludeIds = await this.getExcludedUserIds(viewerId);
    const friendIds = await getAcceptedFriendIds(
      this.friendshipsRepo,
      viewerId,
    );

    const candidates = new Map<string, CandidateAccum>();

    await this.addFriendsOfFriends(viewerId, friendIds, excludeIds, candidates);
    await this.addSameGym(viewerId, excludeIds, candidates);

    if (candidates.size === 0) return [];

    const ranked = rankFriendSuggestionCandidates(candidates);
    const rankedIds = ranked.map((r) => r.userId);

    const profiles = await this.profilesRepo.find({
      where: { userId: In(rankedIds) },
    });
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
    const premiumByUserId = await loadPremiumByUserIds(this.usersRepo, rankedIds);

    const suggestions: FriendSuggestion[] = [];
    for (const row of ranked) {
      if (suggestions.length >= SUGGESTIONS_LIMIT) break;
      const profile = profileByUserId.get(row.userId);
      if (!profile) continue;
      if (!profile.discoverableByUsername && !profile.searchableByName) {
        continue;
      }
      suggestions.push({
        userId: row.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        isPremium: premiumByUserId.get(row.userId) ?? false,
        reasons: buildSuggestionReasons(row.mutualFriendsCount, row.sameGym),
        mutualFriendsCount: row.mutualFriendsCount,
      });
    }

    return suggestions;
  }

  private async getExcludedUserIds(viewerId: string): Promise<Set<string>> {
    const rows = await this.friendshipsRepo.find({
      where: [{ requesterId: viewerId }, { addresseeId: viewerId }],
    });
    const excluded = new Set<string>([viewerId]);
    for (const row of rows) {
      excluded.add(
        row.requesterId === viewerId ? row.addresseeId : row.requesterId,
      );
    }
    return excluded;
  }

  private async addFriendsOfFriends(
    viewerId: string,
    friendIds: string[],
    excludeIds: Set<string>,
    candidates: Map<string, CandidateAccum>,
  ): Promise<void> {
    if (friendIds.length === 0) return;

    const friendSet = new Set(friendIds);
    const edges = await this.friendshipsRepo.find({
      where: [
        { requesterId: In(friendIds), status: FriendshipStatus.ACCEPTED },
        { addresseeId: In(friendIds), status: FriendshipStatus.ACCEPTED },
      ],
    });

    const mutualsByCandidate = new Map<string, Set<string>>();

    for (const edge of edges) {
      const a = edge.requesterId;
      const b = edge.addresseeId;

      let friendId: string | null = null;
      let candidateId: string | null = null;

      if (friendSet.has(a) && !friendSet.has(b) && b !== viewerId) {
        friendId = a;
        candidateId = b;
      } else if (friendSet.has(b) && !friendSet.has(a) && a !== viewerId) {
        friendId = b;
        candidateId = a;
      }

      if (!friendId || !candidateId) continue;
      if (excludeIds.has(candidateId)) continue;

      let mutuals = mutualsByCandidate.get(candidateId);
      if (!mutuals) {
        mutuals = new Set();
        mutualsByCandidate.set(candidateId, mutuals);
      }
      mutuals.add(friendId);
    }

    for (const [candidateId, mutuals] of mutualsByCandidate) {
      const existing = candidates.get(candidateId) ?? {
        mutualFriendsCount: 0,
        sameGym: false,
      };
      existing.mutualFriendsCount = mutuals.size;
      candidates.set(candidateId, existing);
    }
  }

  private async addSameGym(
    viewerId: string,
    excludeIds: Set<string>,
    candidates: Map<string, CandidateAccum>,
  ): Promise<void> {
    const viewerGym = await this.gymsRepo.findOne({
      where: { userId: viewerId },
    });
    if (!viewerGym?.placeId) return;

    const sameGymUsers = await this.gymsRepo.find({
      where: { placeId: viewerGym.placeId },
    });

    for (const gym of sameGymUsers) {
      if (excludeIds.has(gym.userId)) continue;
      const existing = candidates.get(gym.userId) ?? {
        mutualFriendsCount: 0,
        sameGym: false,
      };
      existing.sameGym = true;
      candidates.set(gym.userId, existing);
    }
  }
}
