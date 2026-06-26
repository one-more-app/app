import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { UserProgressEntity } from '../progress/entities/user-progress.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { PresenceStatus } from '../presence/entities/presence-status.enum.js';
import { UserPresenceEntity } from '../presence/entities/user-presence.entity.js';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { FriendshipStatus } from '../social/entities/friendship-status.enum.js';
import { applyStreakExpiry } from '../progress/lib/streak-dates.js';
import { isStreakAtRisk } from '../progress/lib/streak-dates.js';
import { FriendTrainingAlertsService } from './friend-training-alerts.service.js';
import { formatUserDisplayName } from './lib/display-name.js';
import { localDateKey, localWeekKey } from './lib/timezone.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationType } from './entities/notification-type.enum.js';
import { PushNotificationService } from './push-notification.service.js';
import { RealtimeBroadcaster } from '../realtime/realtime-broadcaster.service.js';

const PRESENCE_STALE_MS = 90_000;

@Injectable()
export class NotificationDispatchService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(UserProgressEntity)
    private readonly progressRepo: Repository<UserProgressEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
    @InjectRepository(XpEventEntity)
    private readonly xpRepo: Repository<XpEventEntity>,
    private readonly prefs: NotificationPreferencesService,
    private readonly push: PushNotificationService,
    private readonly trainingAlerts: FriendTrainingAlertsService,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    @InjectRepository(UserPresenceEntity)
    private readonly presenceRepo: Repository<UserPresenceEntity>,
    private readonly realtime: RealtimeBroadcaster,
  ) {}

  private async isUserOnline(userId: string): Promise<boolean> {
    const row = await this.presenceRepo.findOne({ where: { userId } });
    if (!row) return false;
    const age = Date.now() - row.lastHeartbeatAt.getTime();
    if (age > PRESENCE_STALE_MS) return false;
    return row.status !== PresenceStatus.OFFLINE;
  }

  private async profileName(userId: string): Promise<string> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) return 'Un ami';
    return formatUserDisplayName(profile);
  }

  private async getAcceptedFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.friendshipsRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });
    return friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );
  }

  private truncate(text: string, max = 80): string {
    const trimmed = text.trim();
    if (trimmed.length <= max) return trimmed;
    return `${trimmed.slice(0, max - 1)}…`;
  }

  async notifyFriendRequest(params: {
    addresseeId: string;
    requesterId: string;
    friendshipId: string;
  }) {
    if (!(await this.prefs.isEnabled(params.addresseeId, NotificationType.FriendRequest))) {
      return;
    }
    const name = await this.profileName(params.requesterId);
    this.realtime.emitFriendshipUpdated(params.addresseeId, {
      friendshipId: params.friendshipId,
      action: 'request',
    });
    await this.push.sendToUser(params.addresseeId, {
      type: NotificationType.FriendRequest,
      title: 'Demande d\'ami',
      body: `${name} veut t'ajouter en ami`,
      route: '/friends',
      dedupKey: `request:${params.friendshipId}`,
    });
  }

  async notifyReferralUsed(params: {
    referrerId: string;
    referredUserId: string;
  }) {
    if (
      !(await this.prefs.isEnabled(params.referrerId, NotificationType.ReferralUsed))
    ) {
      return;
    }
    const name = await this.profileName(params.referredUserId);
    await this.push.sendToUser(params.referrerId, {
      type: NotificationType.ReferralUsed,
      title: 'Nouveau parrainage',
      body: `${name} a utilisé ton code de parrainage`,
      route: '/settings',
      dedupKey: `referral:${params.referredUserId}`,
    });
  }

  async notifyFriendAccepted(params: {
    requesterId: string;
    addresseeId: string;
    friendshipId: string;
  }) {
    if (!(await this.prefs.isEnabled(params.requesterId, NotificationType.FriendAccepted))) {
      return;
    }
    const name = await this.profileName(params.addresseeId);
    this.realtime.emitFriendshipUpdated(params.requesterId, {
      friendshipId: params.friendshipId,
      action: 'accepted',
    });
    await this.push.sendToUser(params.requesterId, {
      type: NotificationType.FriendAccepted,
      title: 'Demande acceptée',
      body: `${name} a accepté ta demande`,
      route: `/friends/${params.addresseeId}`,
      dedupKey: `accepted:${params.friendshipId}`,
    });
  }

  async notifyMessageNew(params: {
    recipientId: string;
    senderId: string;
    conversationId: string;
    body: string;
  }) {
    if (!(await this.prefs.isEnabled(params.recipientId, NotificationType.MessageNew))) {
      return;
    }
    if (await this.isUserOnline(params.recipientId)) {
      return;
    }
    const name = await this.profileName(params.senderId);
    await this.push.sendToUser(params.recipientId, {
      type: NotificationType.MessageNew,
      title: name,
      body: this.truncate(params.body),
      route: `/friends/chat/${params.conversationId}`,
      dedupKey: `msg:${params.conversationId}:${Date.now()}`,
    });
  }

  async notifyFriendTraining(params: {
    trainingUserId: string;
    exerciseName: string | null;
  }) {
    const subscribers = await this.trainingAlerts.listSubscribersForFriend(
      params.trainingUserId,
    );
    if (subscribers.length === 0) return;

    const name = await this.profileName(params.trainingUserId);
    const exercise = params.exerciseName?.trim() || 'un exercice';
    const today = localDateKey('UTC');

    for (const subscriberId of subscribers) {
      if (!(await this.prefs.isEnabled(subscriberId, NotificationType.FriendTraining))) {
        continue;
      }
      await this.push.sendToUser(subscriberId, {
        type: NotificationType.FriendTraining,
        title: 'Séance en cours',
        body: `${name} s'entraîne sur ${exercise}`,
        route: `/friends/${params.trainingUserId}`,
        dedupKey: `training:${params.trainingUserId}:${today}`,
      });
    }
  }

  async notifyFriendPr(params: {
    athleteUserId: string;
    exerciseName: string;
    weight: number;
    reps: number;
  }) {
    const friendIds = await this.getAcceptedFriendIds(params.athleteUserId);
    if (friendIds.length === 0) return;

    const name = await this.profileName(params.athleteUserId);
    const today = localDateKey('UTC');

    for (const friendId of friendIds) {
      if (!(await this.prefs.isEnabled(friendId, NotificationType.FriendPr))) {
        continue;
      }
      await this.push.sendToUser(friendId, {
        type: NotificationType.FriendPr,
        title: 'Nouveau record',
        body: `${name} : ${params.exerciseName} : ${params.weight} kg × ${params.reps}`,
        route: `/friends/${params.athleteUserId}`,
        dedupKey: `pr:${params.athleteUserId}:${today}:${Date.now()}`,
      });
    }
  }

  async sendStreakAtRiskForUser(userId: string, timezone: string) {
    if (!(await this.prefs.isEnabled(userId, NotificationType.StreakAtRisk))) {
      return;
    }
    const progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress || progress.currentStreak <= 0 || !progress.lastActiveDate) {
      return;
    }

    const today = localDateKey(timezone);
    if (!isStreakAtRisk(progress.lastActiveDate, progress.currentStreak, today)) {
      return;
    }

    const hadPerfToday = await this.perfRepo
      .createQueryBuilder('p')
      .where('p.userId = :userId', { userId })
      .andWhere('p.date = :today', { today })
      .andWhere('p.deletedAt IS NULL')
      .getCount();
    if (hadPerfToday > 0) return;

    const streak = applyStreakExpiry(
      progress.lastActiveDate,
      progress.currentStreak,
      today,
    );

    await this.push.sendToUser(userId, {
      type: NotificationType.StreakAtRisk,
      title: 'Série en danger',
      body: `Ta série de ${streak} jours expire ce soir. Une séance suffit !`,
      route: '/home',
      dedupKey: `streak:${today}`,
    });
  }

  async sendWeeklyRecapForUser(userId: string, timezone: string) {
    if (!(await this.prefs.isEnabled(userId, NotificationType.WeeklyRecap))) {
      return;
    }

    const today = localDateKey(timezone);
    const weekKey = localWeekKey(timezone);
    const weekStart = new Date(`${today}T12:00:00Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const startDate = localDateKey(timezone, weekStart);

    const sessions = await this.perfRepo
      .createQueryBuilder('p')
      .select('COUNT(DISTINCT p.date)', 'count')
      .where('p.userId = :userId', { userId })
      .andWhere('p.date >= :startDate', { startDate })
      .andWhere('p.date <= :today', { today })
      .andWhere('p.deletedAt IS NULL')
      .getRawOne<{ count: string }>();

    const xpRow = await this.xpRepo
      .createQueryBuilder('x')
      .select('COALESCE(SUM(x.amount), 0)', 'total')
      .where('x.userId = :userId', { userId })
      .andWhere('x.activityDate >= :startDate', { startDate })
      .andWhere('x.activityDate <= :today', { today })
      .getRawOne<{ total: string }>();

    const progress = await this.progressRepo.findOne({ where: { userId } });
    const streak =
      progress && progress.lastActiveDate
        ? applyStreakExpiry(
            progress.lastActiveDate,
            progress.currentStreak,
            today,
          )
        : 0;

    const sessionCount = Number.parseInt(sessions?.count ?? '0', 10);
    const xpTotal = Number.parseInt(xpRow?.total ?? '0', 10);

    await this.push.sendToUser(userId, {
      type: NotificationType.WeeklyRecap,
      title: 'Récap de la semaine',
      body: `${sessionCount} séance${sessionCount > 1 ? 's' : ''}, +${xpTotal} XP, série ${streak}`,
      route: '/history',
      dedupKey: `recap:${weekKey}`,
    });
  }
}
