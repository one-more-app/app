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
import { DeviceTokensService } from './device-tokens.service.js';
import { FriendTrainingAlertsService } from './friend-training-alerts.service.js';
import { formatUserDisplayName } from './lib/display-name.js';
import { localDateKey, localWeekKey } from './lib/timezone.js';
import { NotificationFeedService } from './notification-feed.service.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationType } from './entities/notification-type.enum.js';
import type { PushPayload } from './dto/push-payload.dto.js';
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
    private readonly feed: NotificationFeedService,
    private readonly push: PushNotificationService,
    private readonly deviceTokens: DeviceTokensService,
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
    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );
    return [...new Set(friendIds)];
  }

  private truncate(text: string, max = 80): string {
    const trimmed = text.trim();
    if (trimmed.length <= max) return trimmed;
    return `${trimmed.slice(0, max - 1)}…`;
  }

  /** Always persist to feed; FCM only when prefs allow (and optional online gate). */
  private async deliver(
    userId: string,
    payload: PushPayload,
    opts?: { skipPushIfOnline?: boolean },
  ) {
    const { created } = await this.feed.record(userId, payload);
    if (!created) return;
    if (!(await this.prefs.isEnabled(userId, payload.type))) return;
    if (opts?.skipPushIfOnline && (await this.isUserOnline(userId))) return;
    await this.push.sendToUser(userId, payload);
  }

  async notifyFriendRequest(params: {
    addresseeId: string;
    requesterId: string;
    friendshipId: string;
  }) {
    const name = await this.profileName(params.requesterId);
    this.realtime.emitFriendshipUpdated(params.addresseeId, {
      friendshipId: params.friendshipId,
      action: 'request',
    });
    await this.deliver(params.addresseeId, {
      type: NotificationType.FriendRequest,
      title: "Demande d'ami",
      body: `${name} veut t'ajouter en ami`,
      route: '/friends',
      dedupKey: `request:${params.friendshipId}`,
    });
  }

  async notifyTshirtRewardUnlocked(params: { userId: string }) {
    await this.deliver(params.userId, {
      type: NotificationType.TshirtRewardUnlocked,
      title: 'T-shirt débloqué',
      body: 'Bravo ! Tu as débloqué ton t-shirt One More grâce à tes parrainages.',
      route: '/rewards/tshirt/referral_limited',
      dedupKey: 'tshirt:referral_limited',
    });
  }

  async notifyReferralUsed(params: {
    referrerId: string;
    referredUserId: string;
  }) {
    const name = await this.profileName(params.referredUserId);
    await this.deliver(params.referrerId, {
      type: NotificationType.ReferralUsed,
      title: 'Nouveau parrainage',
      body: `${name} a utilisé ton code de parrainage`,
      route: '/settings?focus=referral',
      dedupKey: `referral:${params.referredUserId}`,
    });
  }

  async notifyFriendAccepted(params: {
    requesterId: string;
    addresseeId: string;
    friendshipId: string;
  }) {
    const name = await this.profileName(params.addresseeId);
    this.realtime.emitFriendshipUpdated(params.requesterId, {
      friendshipId: params.friendshipId,
      action: 'accepted',
    });
    await this.deliver(params.requesterId, {
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
    const name = await this.profileName(params.senderId);
    await this.deliver(
      params.recipientId,
      {
        type: NotificationType.MessageNew,
        title: name,
        body: this.truncate(params.body),
        route: `/friends/chat/${params.conversationId}`,
        dedupKey: `msg:${params.conversationId}:${Date.now()}`,
      },
      { skipPushIfOnline: true },
    );
  }

  async notifySessionComment(params: {
    ownerUserId: string;
    sessionDate: string;
    commentId: string;
    authorUserId: string;
    body: string;
    parentAuthorUserId: string | null;
  }) {
    const recipientIds = new Set<string>();
    if (params.ownerUserId !== params.authorUserId) {
      recipientIds.add(params.ownerUserId);
    }
    if (
      params.parentAuthorUserId &&
      params.parentAuthorUserId !== params.authorUserId
    ) {
      recipientIds.add(params.parentAuthorUserId);
    }
    if (recipientIds.size === 0) return;

    const name = await this.profileName(params.authorUserId);
    const excerpt = this.truncate(params.body);

    for (const recipientId of recipientIds) {
      const isReplyToRecipient =
        params.parentAuthorUserId === recipientId &&
        recipientId !== params.ownerUserId;
      const isOwnerRecipient = recipientId === params.ownerUserId;

      let title = name;
      let body = excerpt;
      if (isReplyToRecipient) {
        title = 'Réponse à ton commentaire';
        body = `${name} · ${excerpt}`;
      } else if (isOwnerRecipient) {
        title = 'Commentaire sur ta séance';
        body = `${name} · ${excerpt}`;
      }

      await this.deliver(
        recipientId,
        {
          type: NotificationType.SessionComment,
          title,
          body,
          route: `/session/${params.ownerUserId}/${params.sessionDate}`,
          dedupKey: `session-comment:${params.commentId}:${recipientId}`,
        },
        { skipPushIfOnline: true },
      );
    }
  }

  async notifySessionReaction(params: {
    ownerUserId: string;
    sessionDate: string;
    authorUserId: string;
    emoji: string;
    targetType: 'session' | 'exercise';
  }) {
    if (params.ownerUserId === params.authorUserId) return;

    const name = await this.profileName(params.authorUserId);
    const scope =
      params.targetType === 'exercise' ? 'un exercice' : 'ta séance';
    await this.deliver(
      params.ownerUserId,
      {
        type: NotificationType.SessionComment,
        title: 'Réaction sur ta séance',
        body: `${name} a réagi ${params.emoji} sur ${scope}`,
        route: `/session/${params.ownerUserId}/${params.sessionDate}`,
        dedupKey: `session-reaction:${params.ownerUserId}:${params.sessionDate}:${params.authorUserId}:${params.emoji}:${params.targetType}:${Date.now()}`,
      },
      { skipPushIfOnline: true },
    );
  }

  async notifyFriendTraining(params: {
    trainingUserId: string;
    exerciseName: string | null;
    sessionDate: string;
  }) {
    const timezone = await this.deviceTokens.getTimezoneForUser(
      params.trainingUserId,
    );
    const today = localDateKey(timezone);
    if (params.sessionDate !== today) return;

    const subscribers = await this.trainingAlerts.listSubscribersForFriend(
      params.trainingUserId,
    );
    if (subscribers.length === 0) return;

    const name = await this.profileName(params.trainingUserId);
    const exercise = params.exerciseName?.trim() || 'un exercice';

    for (const subscriberId of subscribers) {
      await this.deliver(subscriberId, {
        type: NotificationType.FriendTraining,
        title: 'Séance en cours',
        body: `${name} s'entraîne sur ${exercise}`,
        route: `/session/${params.trainingUserId}/${params.sessionDate}`,
        dedupKey: `training:${params.trainingUserId}:${params.sessionDate}`,
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
    const timezone = await this.deviceTokens.getTimezoneForUser(
      params.athleteUserId,
    );
    const today = localDateKey(timezone);

    for (const friendId of friendIds) {
      await this.deliver(friendId, {
        type: NotificationType.FriendPr,
        title: 'Nouveau record',
        body: `${name} : ${params.exerciseName} : ${params.weight} kg × ${params.reps}`,
        route: `/session/${params.athleteUserId}/${today}`,
        dedupKey: `pr:${params.athleteUserId}:${today}:${Date.now()}`,
      });
    }
  }

  async sendStreakAtRiskForUser(userId: string, timezone: string) {
    const progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress || progress.currentStreak <= 0 || !progress.lastActiveDate) {
      return;
    }

    const today = localDateKey(timezone);
    if (
      !isStreakAtRisk(progress.lastActiveDate, progress.currentStreak, today)
    ) {
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

    await this.deliver(userId, {
      type: NotificationType.StreakAtRisk,
      title: 'Série en danger',
      body: `Ta série de ${streak} jours expire ce soir. Une séance suffit !`,
      route: '/home',
      dedupKey: `streak:${today}`,
    });
  }

  async sendTrainingReminderForUser(userId: string, timezone: string) {
    const today = localDateKey(timezone);
    const hadPerfToday = await this.perfRepo
      .createQueryBuilder('p')
      .where('p.userId = :userId', { userId })
      .andWhere('p.date = :today', { today })
      .andWhere('p.deletedAt IS NULL')
      .getCount();
    if (hadPerfToday > 0) return;

    await this.deliver(userId, {
      type: NotificationType.TrainingReminder,
      title: "C'est l'heure",
      body: "Ta séance t'attend. Une rep de plus.",
      route: '/home',
      dedupKey: `training_reminder:${today}`,
    });
  }

  async sendWeeklyRecapForUser(userId: string, timezone: string) {
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

    await this.deliver(userId, {
      type: NotificationType.WeeklyRecap,
      title: 'Récap de la semaine',
      body: `${sessionCount} séance${sessionCount > 1 ? 's' : ''}, +${xpTotal} XP, série ${streak}`,
      route: '/history',
      dedupKey: `recap:${weekKey}`,
    });
  }
}
