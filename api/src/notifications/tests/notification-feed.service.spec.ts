import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotificationType } from '../entities/notification-type.enum.js';

const { NotificationFeedService } = await import(
  '../notification-feed.service.js'
);

describe('NotificationFeedService', () => {
  const deliveriesRepo = {
    save: jest.fn(),
    create: jest.fn((row: unknown) => row),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  let service: InstanceType<typeof NotificationFeedService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationFeedService(deliveriesRepo as any);
  });

  it('records a new notification', async () => {
    const entity = {
      id: 'n1',
      userId: 'u1',
      type: NotificationType.FriendRequest,
      dedupKey: 'request:f1',
      sentAt: new Date('2026-01-01T12:00:00Z'),
      title: "Demande d'ami",
      body: 'Alice veut t\'ajouter en ami',
      route: '/friends',
      readAt: null,
    };
    deliveriesRepo.save.mockResolvedValue(entity);

    const result = await service.record('u1', {
      type: NotificationType.FriendRequest,
      title: "Demande d'ami",
      body: 'Alice veut t\'ajouter en ami',
      route: '/friends',
      dedupKey: 'request:f1',
    });

    expect(result.created).toBe(true);
    expect(result.entity.id).toBe('n1');
    expect(deliveriesRepo.save).toHaveBeenCalled();
  });

  it('returns existing row on dedup conflict', async () => {
    const existing = {
      id: 'n1',
      userId: 'u1',
      type: NotificationType.FriendRequest,
      dedupKey: 'request:f1',
      sentAt: new Date('2026-01-01T12:00:00Z'),
      title: "Demande d'ami",
      body: 'Alice',
      route: '/friends',
      readAt: null,
    };
    deliveriesRepo.save.mockRejectedValue(new Error('unique'));
    deliveriesRepo.findOne.mockResolvedValue(existing);

    const result = await service.record('u1', {
      type: NotificationType.FriendRequest,
      title: "Demande d'ami",
      body: 'Alice',
      route: '/friends',
      dedupKey: 'request:f1',
    });

    expect(result.created).toBe(false);
    expect(result.entity).toBe(existing);
  });

  it('lists feed items with unread count', async () => {
    const sentAt = new Date('2026-01-02T10:00:00Z');
    deliveriesRepo.find.mockResolvedValue([
      {
        id: 'n1',
        type: NotificationType.FriendPr,
        title: 'Nouveau record',
        body: 'Bob : squat',
        route: '/session/x/y',
        sentAt,
        readAt: null,
      },
    ]);
    deliveriesRepo.count.mockResolvedValue(1);

    const feed = await service.list('u1');
    expect(feed.unreadCount).toBe(1);
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      id: 'n1',
      title: 'Nouveau record',
      sentAt: sentAt.toISOString(),
      readAt: null,
    });
  });

  it('marks specific ids as read', async () => {
    deliveriesRepo.update.mockResolvedValue({ affected: 1 });
    deliveriesRepo.count.mockResolvedValue(0);

    const result = await service.markRead('u1', ['n1']);
    expect(result.unreadCount).toBe(0);
    expect(deliveriesRepo.update).toHaveBeenCalled();
  });

  it('marks all as read when ids omitted', async () => {
    deliveriesRepo.update.mockResolvedValue({ affected: 3 });
    deliveriesRepo.count.mockResolvedValue(0);

    const result = await service.markRead('u1');
    expect(result.unreadCount).toBe(0);
    expect(deliveriesRepo.update).toHaveBeenCalled();
  });
});
