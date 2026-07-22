import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule(
  '../../performance/performance-entries.service.js',
  () => ({
    PerformanceEntriesService: class PerformanceEntriesService {},
  }),
);
jest.unstable_mockModule(
  '../../tracked-exercises/tracked-exercises.service.js',
  () => ({
    TrackedExercisesService: class TrackedExercisesService {},
  }),
);
jest.unstable_mockModule('../../presence/presence.service.js', () => ({
  PresenceService: class PresenceService {},
}));
jest.unstable_mockModule('../../social/friends.service.js', () => ({
  FriendsService: class FriendsService {},
}));
jest.unstable_mockModule('../../notifications/lib/timezone.js', () => ({
  localDateKey: () => '2026-07-13',
}));

const { WorkoutSessionsService } =
  await import('../workout-sessions.service.js');

describe('WorkoutSessionsService', () => {
  const commentsRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(),
  };
  const reactionsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const profilesRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const friendsService = {
    getAcceptedFriendIds: jest.fn(),
  };
  const performanceEntriesService = {
    list: jest.fn(),
  };
  const trackedExercisesService = {
    listWithPerformance: jest.fn(),
  };
  const presenceService = {
    getPresence: jest.fn(),
  };

  let service: InstanceType<typeof WorkoutSessionsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    reactionsRepo.find.mockResolvedValue([]);
    service = new WorkoutSessionsService(
      commentsRepo as any,
      reactionsRepo as any,
      profilesRepo as any,
      friendsService as any,
      performanceEntriesService as any,
      trackedExercisesService as any,
      presenceService as any,
    );
  });

  it('refuse l accès à une séance d un non-ami', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue([]);

    await expect(
      service.getSession('viewer-1', 'owner-2', '2026-07-13'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('signale isLive si présence training', async () => {
    profilesRepo.findOne.mockResolvedValue({
      userId: 'owner-1',
      firstName: 'Bob',
      lastName: null,
      username: 'bob',
      avatarUrl: null,
    });
    performanceEntriesService.list.mockResolvedValue([
      {
        id: 'perf-1',
        trackedExerciseId: 'te-1',
        date: '2026-07-13',
        weight: 60,
        reps: 8,
        createdAt: new Date('2026-07-13T08:00:00Z').toISOString(),
        deletedAt: null,
      },
    ]);
    trackedExercisesService.listWithPerformance.mockResolvedValue([]);
    presenceService.getPresence.mockResolvedValue({
      status: 'training',
    });
    commentsRepo.count.mockResolvedValue(0);

    const result = await service.getSession('owner-1', 'owner-1', '2026-07-13');

    expect(result.isLive).toBe(true);
    expect(result.reactions).toEqual([]);
    expect(result.reactionsByExerciseId).toEqual({});
  });

  it('signale isLive si dernière série < 25 min sans présence', async () => {
    profilesRepo.findOne.mockResolvedValue({
      userId: 'owner-1',
      firstName: 'Bob',
      lastName: null,
      username: 'bob',
      avatarUrl: null,
    });
    const recent = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    performanceEntriesService.list.mockResolvedValue([
      {
        id: 'perf-1',
        trackedExerciseId: 'te-1',
        date: '2026-07-13',
        weight: 60,
        reps: 8,
        createdAt: recent,
        deletedAt: null,
      },
    ]);
    trackedExercisesService.listWithPerformance.mockResolvedValue([]);
    presenceService.getPresence.mockResolvedValue({
      status: 'offline',
    });
    commentsRepo.count.mockResolvedValue(0);

    const result = await service.getSession('owner-1', 'owner-1', '2026-07-13');

    expect(result.isLive).toBe(true);
  });

  it('n est pas isLive si idle >= 25 min et pas de présence', async () => {
    profilesRepo.findOne.mockResolvedValue({
      userId: 'owner-1',
      firstName: 'Bob',
      lastName: null,
      username: 'bob',
      avatarUrl: null,
    });
    const stale = new Date(Date.now() - 26 * 60 * 1000).toISOString();
    performanceEntriesService.list.mockResolvedValue([
      {
        id: 'perf-1',
        trackedExerciseId: 'te-1',
        date: '2026-07-13',
        weight: 60,
        reps: 8,
        createdAt: stale,
        deletedAt: null,
      },
    ]);
    trackedExercisesService.listWithPerformance.mockResolvedValue([]);
    presenceService.getPresence.mockResolvedValue({
      status: 'offline',
    });
    commentsRepo.count.mockResolvedValue(0);

    const result = await service.getSession('owner-1', 'owner-1', '2026-07-13');

    expect(result.isLive).toBe(false);
  });

  it('autorise l accès à sa propre séance', async () => {
    profilesRepo.findOne.mockResolvedValue({
      userId: 'owner-1',
      firstName: 'Bob',
      lastName: null,
      username: 'bob',
      avatarUrl: null,
    });
    performanceEntriesService.list.mockResolvedValue([]);
    trackedExercisesService.listWithPerformance.mockResolvedValue([]);
    presenceService.getPresence.mockResolvedValue({
      status: 'offline',
    });
    commentsRepo.count.mockResolvedValue(0);

    const result = await service.getSession('owner-1', 'owner-1', '2026-07-13');

    expect(result.owner.userId).toBe('owner-1');
    expect(result.entries).toEqual([]);
  });

  it('refuse une réponse à une réponse', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    commentsRepo.findOne.mockResolvedValue({
      id: 'parent-1',
      ownerUserId: 'owner-1',
      sessionDate: '2026-07-13',
      parentId: 'root-1',
      deletedAt: null,
    });

    await expect(
      service.createComment(
        'viewer-1',
        'owner-1',
        '2026-07-13',
        'Salut',
        'parent-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crée un commentaire racine', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    commentsRepo.save.mockResolvedValue({
      id: 'comment-1',
      ownerUserId: 'owner-1',
      sessionDate: '2026-07-13',
      authorUserId: 'viewer-1',
      parentId: null,
      body: 'Bravo',
      createdAt: new Date('2026-07-13T10:00:00Z'),
    });
    profilesRepo.find.mockResolvedValue([
      {
        userId: 'viewer-1',
        firstName: 'Alice',
        lastName: null,
        username: 'alice',
        avatarUrl: null,
      },
    ]);

    const result = await service.createComment(
      'viewer-1',
      'owner-1',
      '2026-07-13',
      'Bravo',
    );

    expect(result.comment.body).toBe('Bravo');
    expect(result.comment.parentId).toBeNull();
    expect(result.parentAuthorUserId).toBeNull();
  });

  it('refuse la suppression d un commentaire d un autre auteur', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    commentsRepo.findOne.mockResolvedValue({
      id: 'comment-1',
      ownerUserId: 'owner-1',
      sessionDate: '2026-07-13',
      authorUserId: 'owner-1',
      deletedAt: null,
    });

    await expect(
      service.deleteComment('viewer-1', 'owner-1', '2026-07-13', 'comment-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('retourne un arbre de commentaires', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    commentsRepo.find.mockResolvedValue([
      {
        id: 'root-1',
        ownerUserId: 'owner-1',
        sessionDate: '2026-07-13',
        authorUserId: 'viewer-1',
        parentId: null,
        body: 'Root',
        createdAt: new Date('2026-07-13T10:00:00Z'),
      },
      {
        id: 'reply-1',
        ownerUserId: 'owner-1',
        sessionDate: '2026-07-13',
        authorUserId: 'owner-1',
        parentId: 'root-1',
        body: 'Merci',
        createdAt: new Date('2026-07-13T10:05:00Z'),
      },
    ]);
    profilesRepo.find.mockResolvedValue([
      {
        userId: 'viewer-1',
        firstName: 'Alice',
        lastName: null,
        username: 'alice',
        avatarUrl: null,
      },
      {
        userId: 'owner-1',
        firstName: 'Bob',
        lastName: null,
        username: 'bob',
        avatarUrl: null,
      },
    ]);

    const result = await service.listComments(
      'viewer-1',
      'owner-1',
      '2026-07-13',
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.replies).toHaveLength(1);
    expect(result.items[0]?.replies[0]?.body).toBe('Merci');
  });

  it('rejette une date invalide', async () => {
    await expect(
      service.getSession('owner-1', 'owner-1', '13-07-2026'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('signale un parent introuvable', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    commentsRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createComment(
        'viewer-1',
        'owner-1',
        '2026-07-13',
        'Salut',
        'missing-parent',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ajoute une réaction séance et agrège le compteur', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    reactionsRepo.findOne.mockResolvedValue(null);
    reactionsRepo.save.mockResolvedValue({
      id: 'reaction-1',
      emoji: '🔥',
    });
    reactionsRepo.find.mockResolvedValue([
      {
        id: 'reaction-1',
        authorUserId: 'viewer-1',
        emoji: '🔥',
        targetType: 'session',
        trackedExerciseId: null,
        createdAt: new Date('2026-07-13T10:00:00Z'),
      },
      {
        id: 'reaction-2',
        authorUserId: 'owner-1',
        emoji: '🔥',
        targetType: 'session',
        trackedExerciseId: null,
        createdAt: new Date('2026-07-13T10:01:00Z'),
      },
    ]);

    const result = await service.toggleReaction(
      'viewer-1',
      'owner-1',
      '2026-07-13',
      '🔥',
      'session',
    );

    expect(result.added).toBe(true);
    expect(result.target.reactions).toEqual([
      { emoji: '🔥', count: 2, reactedByMe: true },
    ]);
  });

  it('retire une réaction au re-toggle', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    reactionsRepo.findOne.mockResolvedValue({
      id: 'reaction-1',
      authorUserId: 'viewer-1',
      emoji: '💪',
      targetType: 'session',
      trackedExerciseId: null,
    });
    reactionsRepo.find.mockResolvedValue([]);

    const result = await service.toggleReaction(
      'viewer-1',
      'owner-1',
      '2026-07-13',
      '💪',
      'session',
    );

    expect(result.added).toBe(false);
    expect(reactionsRepo.remove).toHaveBeenCalled();
    expect(result.target.reactions).toEqual([]);
  });

  it('refuse un emoji non autorisé', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);

    await expect(
      service.toggleReaction(
        'viewer-1',
        'owner-1',
        '2026-07-13',
        '🍕',
        'session',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('exige trackedExerciseId pour une réaction exercice', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);

    await expect(
      service.toggleReaction(
        'viewer-1',
        'owner-1',
        '2026-07-13',
        '🔥',
        'exercise',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse la réaction d un non-ami', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue([]);

    await expect(
      service.toggleReaction(
        'viewer-1',
        'owner-2',
        '2026-07-13',
        '🔥',
        'session',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('agrège les réactions par exercice dans getSession', async () => {
    friendsService.getAcceptedFriendIds.mockResolvedValue(['owner-1']);
    profilesRepo.findOne.mockResolvedValue({
      userId: 'owner-1',
      firstName: 'Bob',
      lastName: null,
      username: 'bob',
      avatarUrl: null,
    });
    performanceEntriesService.list.mockResolvedValue([]);
    trackedExercisesService.listWithPerformance.mockResolvedValue([]);
    presenceService.getPresence.mockResolvedValue({ status: 'offline' });
    commentsRepo.count.mockResolvedValue(0);
    reactionsRepo.find.mockResolvedValue([
      {
        id: 'r1',
        authorUserId: 'viewer-1',
        emoji: '🔥',
        targetType: 'session',
        trackedExerciseId: null,
        createdAt: new Date('2026-07-13T10:00:00Z'),
      },
      {
        id: 'r2',
        authorUserId: 'owner-1',
        emoji: '💪',
        targetType: 'exercise',
        trackedExerciseId: 'te-1',
        createdAt: new Date('2026-07-13T10:01:00Z'),
      },
    ]);

    const result = await service.getSession(
      'viewer-1',
      'owner-1',
      '2026-07-13',
    );

    expect(result.reactions).toEqual([
      { emoji: '🔥', count: 1, reactedByMe: true },
    ]);
    expect(result.reactionsByExerciseId['te-1']).toEqual([
      { emoji: '💪', count: 1, reactedByMe: false },
    ]);
  });
});
