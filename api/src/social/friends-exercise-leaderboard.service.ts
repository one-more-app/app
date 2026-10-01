import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { bestEstimatedOneRmFromEntries } from '../shared/best-estimated-one-rm.js';
import {
  getLeagueInfo,
  isBodyweightAdditiveExercise,
  type RankId,
} from '../shared/strength-standards.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { getAcceptedFriendIds } from './lib/accepted-friend-ids.js';

export type FriendsExerciseLeaderboardEntry = {
  rank: number;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  isMe: boolean;
  oneRM: number;
  sourceWeight: number;
  sourceReps: number;
  sourceDate: string;
  rankId: RankId | null;
  firstName: string | null;
  lastName: string | null;
};

export type FriendsExerciseLeaderboardResponse = {
  exerciseId: string;
  entries: FriendsExerciseLeaderboardEntry[];
  emptyReason: 'no_friends_on_exercise' | null;
};

function normalizeGender(
  raw: string | null | undefined,
): 'male' | 'female' | null {
  if (raw === 'male' || raw === 'female') return raw;
  return null;
}

@Injectable()
export class FriendsExerciseLeaderboardService {
  constructor(
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfsRepo: Repository<PerformanceEntryEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
  ) {}

  async getLeaderboard(
    viewerId: string,
    exerciseId: string,
  ): Promise<FriendsExerciseLeaderboardResponse> {
    const trimmed = exerciseId?.trim();
    if (!trimmed) {
      throw new BadRequestException('exerciseId is required');
    }

    const friendIds = await getAcceptedFriendIds(
      this.friendshipsRepo,
      viewerId,
    );
    const candidateUserIds = [...new Set([viewerId, ...friendIds])];

    const tracked = await this.trackedRepo.find({
      where: {
        userId: In(candidateUserIds),
        exerciseId: trimmed,
        deletedAt: IsNull(),
      },
    });

    if (tracked.length === 0) {
      return {
        exerciseId: trimmed,
        entries: [],
        emptyReason: 'no_friends_on_exercise',
      };
    }

    const trackedIds = tracked.map((t) => t.id);
    const trackedByUserId = new Map(
      tracked.map((t) => [t.userId, t] as const),
    );

    const perfs = await this.perfsRepo.find({
      where: {
        trackedExerciseId: In(trackedIds),
        deletedAt: IsNull(),
      },
    });

    const perfsByTrackedId = new Map<string, PerformanceEntryEntity[]>();
    for (const perf of perfs) {
      const list = perfsByTrackedId.get(perf.trackedExerciseId) ?? [];
      list.push(perf);
      perfsByTrackedId.set(perf.trackedExerciseId, list);
    }

    const userIdsWithTracked = [...trackedByUserId.keys()];
    const profiles =
      userIdsWithTracked.length === 0
        ? []
        : await this.profilesRepo.find({
            where: { userId: In(userIdsWithTracked) },
          });
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

    const rankedRaw: Omit<FriendsExerciseLeaderboardEntry, 'rank'>[] = [];

    for (const userId of userIdsWithTracked) {
      const te = trackedByUserId.get(userId);
      if (!te) continue;
      const userPerfs = perfsByTrackedId.get(te.id) ?? [];
      if (userPerfs.length === 0) continue;

      const profile = profileByUserId.get(userId);
      const exerciseName = te.originalName ?? te.name;
      const exerciseMetadata = {
        equipment: te.equipment ?? undefined,
        target: te.target ?? undefined,
      };
      const isBodyweightAdditive = isBodyweightAdditiveExercise(
        exerciseName,
        exerciseMetadata,
      );

      const best = bestEstimatedOneRmFromEntries(
        userPerfs.map((p) => ({
          weight: p.weight,
          reps: p.reps,
          date: p.date,
        })),
        {
          bodyWeightKg: profile?.weightKg ?? null,
          isBodyweightAdditive,
        },
      );
      if (!best) continue;

      const gender = normalizeGender(profile?.gender);
      const bodyWeightKg = profile?.weightKg ?? 0;
      const league =
        gender && bodyWeightKg > 0
          ? getLeagueInfo({
              weight: best.sourceWeight,
              reps: best.sourceReps,
              bodyWeightKg,
              gender,
              exerciseName,
              exerciseMetadata,
            })
          : null;

      rankedRaw.push({
        userId,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
        isMe: userId === viewerId,
        oneRM: best.oneRM,
        sourceWeight: best.sourceWeight,
        sourceReps: best.sourceReps,
        sourceDate: best.sourceDate,
        rankId: league?.rankId ?? null,
      });
    }

    rankedRaw.sort((a, b) => {
      if (a.oneRM !== b.oneRM) return b.oneRM - a.oneRM;
      if (a.sourceReps !== b.sourceReps) return b.sourceReps - a.sourceReps;
      if (a.sourceDate !== b.sourceDate) {
        return a.sourceDate < b.sourceDate ? 1 : -1;
      }
      return a.userId.localeCompare(b.userId);
    });

    const entries: FriendsExerciseLeaderboardEntry[] = rankedRaw.map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
      }),
    );

    const friendOnBoard = entries.some((e) => !e.isMe);
    return {
      exerciseId: trimmed,
      entries,
      emptyReason: friendOnBoard ? null : 'no_friends_on_exercise',
    };
  }
}
