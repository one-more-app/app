import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { FriendsExerciseLeaderboardService } from '../friends-exercise-leaderboard.service.js';
import { FriendshipStatus } from '../entities/friendship-status.enum.js';
import { estimate1RM } from '../../shared/strength-standards.js';

describe('FriendsExerciseLeaderboardService', () => {
  const viewerId = 'viewer';
  const friendId = 'friend-1';
  const strangerId = 'stranger';
  const exerciseId = 'ex-bench';

  let friendshipsRepo: {
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let trackedRepo: {
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let perfsRepo: {
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let profilesRepo: {
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let service: FriendsExerciseLeaderboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    friendshipsRepo = {
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    trackedRepo = {
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    perfsRepo = {
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    profilesRepo = {
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    service = new FriendsExerciseLeaderboardService(
      friendshipsRepo as never,
      trackedRepo as never,
      perfsRepo as never,
      profilesRepo as never,
    );
  });

  it('rejects empty exerciseId', async () => {
    await expect(service.getLeaderboard(viewerId, '  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('ranks viewer and friends by 1RM, excludes non-friends', async () => {
    friendshipsRepo.find.mockResolvedValue([
      {
        requesterId: viewerId,
        addresseeId: friendId,
        status: FriendshipStatus.ACCEPTED,
      },
    ]);
    trackedRepo.find.mockResolvedValue([
      {
        id: 'te-viewer',
        userId: viewerId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
      {
        id: 'te-friend',
        userId: friendId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
      {
        id: 'te-stranger',
        userId: strangerId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
    ]);
    // In() filter is applied by TypeORM; our mock returns all — service only
    // queries candidate ids, so simulate filtered tracked list:
    trackedRepo.find.mockResolvedValue([
      {
        id: 'te-viewer',
        userId: viewerId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
      {
        id: 'te-friend',
        userId: friendId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
    ]);
    perfsRepo.find.mockResolvedValue([
      {
        trackedExerciseId: 'te-viewer',
        weight: 100,
        reps: 5,
        date: '2026-01-01',
        deletedAt: null,
      },
      {
        trackedExerciseId: 'te-friend',
        weight: 120,
        reps: 3,
        date: '2026-01-02',
        deletedAt: null,
      },
    ]);
    profilesRepo.find.mockResolvedValue([
      {
        userId: viewerId,
        username: 'me',
        avatarUrl: null,
        weightKg: 80,
        gender: 'male',
      },
      {
        userId: friendId,
        username: 'buddy',
        avatarUrl: 'https://img',
        weightKg: 85,
        gender: 'male',
      },
    ]);

    const result = await service.getLeaderboard(viewerId, exerciseId);

    expect(result.exerciseId).toBe(exerciseId);
    expect(result.emptyReason).toBeNull();
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.userId).toBe(friendId);
    expect(result.entries[0]!.rank).toBe(1);
    expect(result.entries[0]!.isMe).toBe(false);
    expect(result.entries[0]!.oneRM).toBe(estimate1RM(120, 3));
    expect(result.entries[0]!.sourceWeight).toBe(120);
    expect(result.entries[0]!.sourceReps).toBe(3);
    expect(result.entries[0]!.rankId).toEqual(expect.any(String));
    expect(result.entries[1]!.userId).toBe(viewerId);
    expect(result.entries[1]!.isMe).toBe(true);
    expect(result.entries[1]!.rank).toBe(2);
    expect(result.entries[1]!.rankId).toEqual(expect.any(String));
  });

  it('sets emptyReason when no friend is on the board', async () => {
    friendshipsRepo.find.mockResolvedValue([]);
    trackedRepo.find.mockResolvedValue([
      {
        id: 'te-viewer',
        userId: viewerId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
    ]);
    perfsRepo.find.mockResolvedValue([
      {
        trackedExerciseId: 'te-viewer',
        weight: 100,
        reps: 1,
        date: '2026-01-01',
        deletedAt: null,
      },
    ]);
    profilesRepo.find.mockResolvedValue([
      { userId: viewerId, username: 'me', avatarUrl: null, weightKg: 80 },
    ]);

    const result = await service.getLeaderboard(viewerId, exerciseId);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.isMe).toBe(true);
    expect(result.emptyReason).toBe('no_friends_on_exercise');
  });

  it('excludes soft-deleted tracked / perfs and users without valid 1RM', async () => {
    friendshipsRepo.find.mockResolvedValue([
      {
        requesterId: viewerId,
        addresseeId: friendId,
        status: FriendshipStatus.ACCEPTED,
      },
    ]);
    // Soft-deleted tracked never returned thanks to IsNull filter; empty perfs
    trackedRepo.find.mockResolvedValue([
      {
        id: 'te-friend',
        userId: friendId,
        exerciseId,
        name: 'Bench Press',
        originalName: 'barbell bench press',
        equipment: 'barbell',
        target: 'pectorals',
        deletedAt: null,
      },
    ]);
    perfsRepo.find.mockResolvedValue([
      {
        trackedExerciseId: 'te-friend',
        weight: 0,
        reps: 5,
        date: '2026-01-01',
        deletedAt: null,
      },
    ]);
    profilesRepo.find.mockResolvedValue([
      { userId: friendId, username: 'buddy', avatarUrl: null, weightKg: 80 },
    ]);

    const result = await service.getLeaderboard(viewerId, exerciseId);
    expect(result.entries).toEqual([]);
    expect(result.emptyReason).toBe('no_friends_on_exercise');
  });
});
