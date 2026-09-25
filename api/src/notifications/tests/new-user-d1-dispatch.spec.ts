import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotificationType } from '../entities/notification-type.enum.js';

const { NotificationDispatchService } = await import(
  '../notification-dispatch.service.js'
);

describe('NotificationDispatchService new user D+1', () => {
  const perfRepo = {
    createQueryBuilder: jest.fn(),
  };
  const prefs = {
    isEnabled: jest.fn(async () => true),
  };
  const feed = {
    record: jest.fn(async () => ({ created: true, entity: {} })),
  };
  const push = {
    sendToUser: jest.fn(async () => undefined),
  };
  const presenceRepo = {
    findOne: jest.fn(async () => null),
  };

  let service: InstanceType<typeof NotificationDispatchService>;

  beforeEach(() => {
    jest.clearAllMocks();
    prefs.isEnabled.mockResolvedValue(true);
    feed.record.mockResolvedValue({ created: true, entity: {} });
    service = new NotificationDispatchService(
      {} as any,
      {} as any,
      perfRepo as any,
      {} as any,
      prefs as any,
      feed as any,
      push as any,
      {} as any,
      {} as any,
      {} as any,
      presenceRepo as any,
      {} as any,
    );
  });

  function mockPerfCount(count: number) {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(async () => count),
    };
    perfRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  it('skips training slots when user already logged a perf today', async () => {
    mockPerfCount(1);
    await service.sendNewUserD1TrainingForUser('u1', 'UTC', 7);
    expect(feed.record).not.toHaveBeenCalled();
    expect(push.sendToUser).not.toHaveBeenCalled();
  });

  it('delivers morning training copy when no perf today', async () => {
    mockPerfCount(0);
    await service.sendNewUserD1TrainingForUser('u1', 'UTC', 7);
    expect(feed.record).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        type: NotificationType.NewUserD1Morning,
        title: 'One More',
        body: "N'oublie pas de t'entraîner aujourd'hui.",
        route: '/home',
        dedupKey: 'new_user_d1_morning:u1',
      }),
    );
    expect(push.sendToUser).toHaveBeenCalled();
  });

  it('delivers referral even when user already trained', async () => {
    await service.sendNewUserD1ReferralForUser('u1');
    expect(feed.record).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        type: NotificationType.NewUserD1Referral,
        title: 'Invite un pote',
        body: 'Parraine et gagne un t-shirt One More.',
        route: '/settings?focus=referral',
        dedupKey: 'new_user_d1_referral:u1',
      }),
    );
  });
});
