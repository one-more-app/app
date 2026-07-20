import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { EventExercise } from '../entities/event-exercise.enum.js';
import { EventGender } from '../entities/event-gender.enum.js';

const { EventService } = await import('../event.service.js');

describe('EventService active attempt', () => {
  const entriesRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn((data) => data),
    createQueryBuilder: jest.fn(),
  };

  const attemptRepo = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
    clear: jest.fn(),
    count: jest.fn(),
  };

  const catalogRepo = {
    find: jest.fn(),
  };

  let service: InstanceType<typeof EventService>;
  let pendingResultEntry: Record<string, unknown> | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    pendingResultEntry = null;
    catalogRepo.find.mockResolvedValue([]);
    entriesRepo.find.mockResolvedValue([]);
    entriesRepo.update.mockResolvedValue({ affected: 1 });
    entriesRepo.save.mockImplementation((entry: Record<string, unknown>) => {
      pendingResultEntry = {
        ...entry,
        id: 'entry-1',
        createdAt: new Date('2026-07-20T10:05:00.000Z'),
      };
      return pendingResultEntry;
    });
    entriesRepo.findOne.mockImplementation(
      (options?: { where?: Record<string, unknown> }) => {
        const where = options?.where ?? {};
        if (where.resultDisplayPending === true) {
          return pendingResultEntry;
        }
        if (where.celebrationPending === true) {
          return null;
        }
        return null;
      },
    );
    entriesRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });
    service = new EventService(
      entriesRepo as any,
      attemptRepo as any,
      catalogRepo as any,
    );
  });

  it('starts attempt with reps at zero', async () => {
    attemptRepo.clear.mockResolvedValue(undefined);
    attemptRepo.save.mockImplementation((attempt) => ({
      ...attempt,
      id: 'attempt-1',
      startedAt: new Date('2026-07-20T10:00:00.000Z'),
    }));

    const result = await service.startAttempt({
      firstName: 'Alex',
      lastName: 'Martin',
      email: 'alex@example.com',
      gender: EventGender.Male,
      exercise: EventExercise.PullUp,
    });

    expect(attemptRepo.clear).toHaveBeenCalled();
    expect(entriesRepo.update).toHaveBeenCalledWith(
      { resultDisplayPending: true, deletedAt: IsNull() },
      { resultDisplayPending: false },
    );
    expect(result.reps).toBe(0);
    expect(result.displayName).toBe('Alex Martin');
  });

  it('patches attempt reps', async () => {
    attemptRepo.find.mockResolvedValue([
      {
        id: 'attempt-1',
        firstName: 'Alex',
        lastName: 'Martin',
        email: 'alex@example.com',
        gender: EventGender.Male,
        exercise: EventExercise.PullUp,
        notes: null,
        reps: 0,
        startedAt: new Date('2026-07-20T10:00:00.000Z'),
      },
    ]);
    attemptRepo.save.mockImplementation((attempt) => attempt);

    const result = await service.patchAttemptReps(12);

    expect(result.reps).toBe(12);
  });

  it('finalizes attempt and exposes recent result on leaderboard payload', async () => {
    attemptRepo.find.mockResolvedValue([
      {
        id: 'attempt-1',
        firstName: 'Alex',
        lastName: 'Martin',
        email: 'alex@example.com',
        gender: EventGender.Male,
        exercise: EventExercise.PullUp,
        notes: null,
        reps: 12,
        startedAt: new Date('2026-07-20T10:00:00.000Z'),
      },
    ]);
    attemptRepo.clear.mockResolvedValue(undefined);

    const { entry, attemptResult } = await service.finalizeAttempt();

    expect(entry.rank).toBe(1);
    expect(attemptResult.reps).toBe(12);
    expect(attemptRepo.clear).toHaveBeenCalled();

    attemptRepo.find.mockResolvedValue([]);
    const payload = await service.getLeaderboardPayload();
    expect(payload.activeAttempt).toBeNull();
    expect(payload.recentResult?.entryId).toBe('entry-1');
    expect(payload.recentResult?.rank).toBe(1);
  });

  it('rejects finalize when reps are zero', async () => {
    attemptRepo.find.mockResolvedValue([
      {
        id: 'attempt-1',
        firstName: 'Alex',
        lastName: 'Martin',
        email: 'alex@example.com',
        gender: EventGender.Male,
        exercise: EventExercise.PullUp,
        notes: null,
        reps: 0,
        startedAt: new Date('2026-07-20T10:00:00.000Z'),
      },
    ]);

    await expect(service.finalizeAttempt()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when patching reps without active attempt', async () => {
    attemptRepo.find.mockResolvedValue([]);

    await expect(service.patchAttemptReps(5)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('cancels active attempt', async () => {
    attemptRepo.count.mockResolvedValue(1);
    attemptRepo.clear.mockResolvedValue(undefined);

    const result = await service.cancelAttempt();

    expect(result.cancelled).toBe(true);
    expect(attemptRepo.clear).toHaveBeenCalled();
  });

  it('keeps recent result until dismissed', async () => {
    attemptRepo.find.mockResolvedValue([
      {
        id: 'attempt-1',
        firstName: 'Alex',
        lastName: 'Martin',
        email: 'alex@example.com',
        gender: EventGender.Male,
        exercise: EventExercise.PullUp,
        notes: null,
        reps: 8,
        startedAt: new Date('2026-07-20T10:00:00.000Z'),
      },
    ]);
    entriesRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(2),
    });
    attemptRepo.clear.mockResolvedValue(undefined);

    await service.finalizeAttempt();

    let payload = await service.getLeaderboardPayload();
    expect(payload.recentResult?.reps).toBe(8);

    pendingResultEntry = null;
    await expect(service.dismissRecentAttemptResult()).resolves.toEqual({
      dismissed: true,
    });

    payload = await service.getLeaderboardPayload();
    expect(payload.recentResult).toBeNull();
  });

  it('dismisses score and celebration together for TV', async () => {
    await expect(service.dismissTvDisplay()).resolves.toEqual({
      dismissedResult: true,
      dismissedCelebration: true,
    });

    expect(entriesRepo.update).toHaveBeenCalledWith(
      { resultDisplayPending: true, deletedAt: IsNull() },
      { resultDisplayPending: false },
    );
    expect(entriesRepo.update).toHaveBeenCalledWith(
      { celebrationPending: true, deletedAt: IsNull() },
      { celebrationPending: false },
    );
  });
});
