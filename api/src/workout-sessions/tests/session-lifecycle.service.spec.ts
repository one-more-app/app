import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SESSION_ACTIVE_IDLE_MS } from '../../shared/session-timing.js';
import { SessionLifecycleService } from '../session-lifecycle.service.js';

describe('SessionLifecycleService', () => {
  const sessionsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
  };
  const perfRepo = {
    createQueryBuilder: jest.fn(),
  };
  let service: SessionLifecycleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionLifecycleService(sessionsRepo as any, perfRepo as any);
  });

  function mockLastSetAt(date: Date | null) {
    perfRepo.createQueryBuilder.mockReturnValue({
      select: () => ({
        where: () => ({
          andWhere: () => ({
            getRawOne: () => Promise.resolve({ max: date }),
          }),
        }),
      }),
    });
  }

  it('réutilise la session ouverte si idle < 25 min', async () => {
    const open = {
      id: 's1',
      ownerUserId: 'u1',
      sessionDate: '2026-10-09',
      startedAt: new Date('2026-10-09T10:00:00Z'),
      endedAt: null,
    };
    sessionsRepo.findOne.mockResolvedValue(open);
    mockLastSetAt(new Date('2026-10-09T10:05:00Z'));

    const result = await service.attachOrCreateSession(
      'u1',
      '2026-10-09',
      new Date('2026-10-09T10:10:00Z'),
    );

    expect(result.id).toBe('s1');
    expect(sessionsRepo.save).not.toHaveBeenCalled();
  });

  it('clôture et crée une nouvelle séance si idle ≥ 25 min', async () => {
    const lastSet = new Date('2026-10-09T10:00:00Z');
    const open = {
      id: 's1',
      ownerUserId: 'u1',
      sessionDate: '2026-10-09',
      startedAt: lastSet,
      endedAt: null,
    };
    sessionsRepo.findOne.mockResolvedValue(open);
    mockLastSetAt(lastSet);
    sessionsRepo.save.mockImplementation((value) => Promise.resolve(value));

    const setAt = new Date(lastSet.getTime() + SESSION_ACTIVE_IDLE_MS);
    const result = await service.attachOrCreateSession(
      'u1',
      '2026-10-09',
      setAt,
    );

    expect(open.endedAt).toEqual(lastSet);
    expect(result.sessionDate).toBe('2026-10-09');
    expect(result.endedAt).toBeNull();
    expect(result.startedAt).toEqual(setAt);
  });

  it('crée une nouvelle séance si la précédente est déjà terminée', async () => {
    sessionsRepo.findOne.mockResolvedValue(null);
    const setAt = new Date('2026-10-09T18:00:00Z');
    sessionsRepo.save.mockImplementation((value) =>
      Promise.resolve({
        id: 's2',
        ...(value as Record<string, unknown>),
      }),
    );

    const result = await service.attachOrCreateSession(
      'u1',
      '2026-10-09',
      setAt,
    );

    expect(result.id).toBe('s2');
    expect(result.endedAt).toBeNull();
    expect(result.startedAt).toEqual(setAt);
  });

  it('isSessionLive : ouverte + récente sur le jour calendaire passé', () => {
    const session = {
      id: 's1',
      ownerUserId: 'u1',
      sessionDate: '2026-10-11',
      startedAt: new Date('2026-10-10T22:30:00Z'),
      endedAt: null,
    };
    const now = new Date('2026-10-10T22:40:00Z').getTime();

    expect(
      service.isSessionLive(session as any, {
        todayKey: '2026-10-11',
        isPresenceTraining: false,
        lastSetAt: new Date('2026-10-10T22:35:00Z'),
        now,
      }),
    ).toBe(true);

    expect(
      service.isSessionLive(session as any, {
        todayKey: '2026-10-10',
        isPresenceTraining: false,
        lastSetAt: new Date('2026-10-10T22:35:00Z'),
        now,
      }),
    ).toBe(false);
  });
});
