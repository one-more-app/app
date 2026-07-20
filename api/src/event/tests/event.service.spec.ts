import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EventExercise } from '../entities/event-exercise.enum.js';
import { EventGender } from '../entities/event-gender.enum.js';

const { EventService } = await import('../event.service.js');

describe('EventService', () => {
  const entriesRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn((data) => data),
    createQueryBuilder: jest.fn(),
  };

  let service: InstanceType<typeof EventService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventService(entriesRepo as any, { find: jest.fn() } as any);
  });

  it('awards t-shirt when first entry for exercise and gender', async () => {
    entriesRepo.findOne.mockResolvedValue(null);
    entriesRepo.update.mockResolvedValue({ affected: 0 });
    entriesRepo.save.mockImplementation((entry) => ({
      ...entry,
      id: 'entry-1',
      createdAt: new Date('2026-07-20T10:00:00.000Z'),
    }));
    entriesRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    const result = await service.createEntry({
      firstName: 'Alex',
      lastName: 'Martin',
      email: 'alex@example.com',
      gender: EventGender.Male,
      exercise: EventExercise.PullUp,
      reps: 12,
    });

    expect(result.beatPreviousLeader).toBe(true);
    expect(result.tshirtAwarded).toBe(true);
    expect(result.celebrationPending).toBe(true);
    expect(result.rank).toBe(1);
  });

  it('awards t-shirt when beating previous leader', async () => {
    entriesRepo.findOne.mockResolvedValue({ id: 'old-1', reps: 10 });
    entriesRepo.update.mockResolvedValue({ affected: 1 });
    entriesRepo.save.mockImplementation((entry) => ({
      ...entry,
      id: 'entry-2',
      createdAt: new Date('2026-07-20T11:00:00.000Z'),
    }));
    entriesRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    const result = await service.createEntry({
      firstName: 'Léa',
      lastName: 'Dupont',
      email: 'lea@example.com',
      gender: EventGender.Female,
      exercise: EventExercise.Dips,
      reps: 15,
    });

    expect(result.beatPreviousLeader).toBe(true);
    expect(result.tshirtAwarded).toBe(true);
  });

  it('does not award t-shirt when tying previous leader', async () => {
    entriesRepo.findOne.mockResolvedValue({ id: 'old-1', reps: 20 });
    entriesRepo.save.mockImplementation((entry) => ({
      ...entry,
      id: 'entry-3',
      createdAt: new Date('2026-07-20T12:00:00.000Z'),
    }));
    entriesRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    });

    const result = await service.createEntry({
      firstName: 'Tom',
      lastName: 'Bernard',
      email: 'tom@example.com',
      gender: EventGender.Male,
      exercise: EventExercise.PushUp,
      reps: 20,
    });

    expect(result.beatPreviousLeader).toBe(false);
    expect(result.tshirtAwarded).toBe(false);
    expect(result.celebrationPending).toBe(false);
    expect(result.rank).toBe(2);
  });
});
