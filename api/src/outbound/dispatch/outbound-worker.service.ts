import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../../analytics/analytics.service.js';
import { NotificationFeedService } from '../../notifications/notification-feed.service.js';
import { NotificationPreferencesService } from '../../notifications/notification-preferences.service.js';
import { PushNotificationService } from '../../notifications/push-notification.service.js';
import { ConsentService } from '../consent/consent.service.js';
import { OutboundMessageEntity } from '../entities/outbound-message.entity.js';
import { EmailFontService } from '../providers/email-font.service.js';
import { OutboundMailerService } from '../providers/outbound-mailer.service.js';
import { TemplateService } from '../templates/template.service.js';
import { TemplateRendererService } from '../templates/template-renderer.service.js';
import { OutboundSendService } from './outbound-send.service.js';
import { NotificationType } from '../../notifications/entities/notification-type.enum.js';

const MANAGE_PREFS_URL = 'https://one-more.app/#/settings';

function pushNotificationTypeForTemplate(
  templateKey: string,
): NotificationType {
  const map: Record<string, NotificationType> = {
    weekly_recap: NotificationType.WeeklyRecap,
    monthly_ranking_recap: NotificationType.MonthlyRankingRecap,
    streak_at_risk: NotificationType.StreakAtRisk,
    training_reminder: NotificationType.TrainingReminder,
    new_user_d1_morning: NotificationType.NewUserD1Morning,
    new_user_d1_midday_train: NotificationType.NewUserD1MiddayTrain,
    new_user_d1_referral: NotificationType.NewUserD1Referral,
    new_user_d1_evening: NotificationType.NewUserD1Evening,
  };
  return map[templateKey] ?? NotificationType.OutboundMarketing;
}
const BATCH_SIZE = 25;

function sesRatePerSecond(): number {
  const raw = process.env.SES_MAX_SEND_PER_SECOND?.trim() ?? '14';
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 14;
}

@Injectable()
export class OutboundWorkerService {
  private readonly logger = new Logger(OutboundWorkerService.name);
  private emailsThisSecond = 0;
  private secondWindow = Math.floor(Date.now() / 1000);

  constructor(
    @InjectRepository(OutboundMessageEntity)
    private readonly messagesRepo: Repository<OutboundMessageEntity>,
    private readonly templates: TemplateService,
    private readonly renderer: TemplateRendererService,
    private readonly send: OutboundSendService,
    private readonly consent: ConsentService,
    private readonly mailer: OutboundMailerService,
    private readonly fonts: EmailFontService,
    private readonly push: PushNotificationService,
    private readonly prefs: NotificationPreferencesService,
    private readonly feed: NotificationFeedService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Cron('*/5 * * * * *')
  async drainQueue(): Promise<void> {
    const limit = Math.min(BATCH_SIZE, sesRatePerSecond());
    const rows = await this.messagesRepo.manager.transaction(async (em) => {
      const repo = em.getRepository(OutboundMessageEntity);
      const pending = await repo
        .createQueryBuilder('m')
        .where('m.status = :status', { status: 'pending' })
        .orderBy('m.createdAt', 'ASC')
        .limit(limit)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getMany();

      for (const row of pending) {
        row.status = 'sending';
      }
      if (pending.length > 0) {
        await repo.save(pending);
      }
      return pending;
    });

    for (const row of rows) {
      try {
        await this.deliverOne(row);
      } catch (err) {
        await this.messagesRepo.update(row.id, {
          status: 'failed',
          lastError: String(err),
        });
        this.logger.warn(`Outbound ${row.id} failed: ${String(err)}`);
      }
    }
  }

  private canSendEmailNow(): boolean {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec !== this.secondWindow) {
      this.secondWindow = nowSec;
      this.emailsThisSecond = 0;
    }
    if (this.emailsThisSecond >= sesRatePerSecond()) return false;
    this.emailsThisSecond += 1;
    return true;
  }

  private async deliverOne(row: OutboundMessageEntity): Promise<void> {
    const template = await this.templates.getActiveByKey(row.templateKey);

    if (row.channel === 'push') {
      const notificationType = pushNotificationTypeForTemplate(row.templateKey);
      const payload = this.renderer.renderPush({
        template,
        variables: row.variables,
        dedupKey: row.dedupKey,
        notificationType,
      });
      const { created } = await this.feed.record(row.userId, payload);
      if (!created) {
        await this.messagesRepo.update(row.id, {
          status: 'sent',
          sentAt: new Date(),
        });
        return;
      }
      if (await this.prefs.isEnabled(row.userId, payload.type)) {
        await this.push.sendToUser(row.userId, payload);
      }
      await this.messagesRepo.update(row.id, {
        status: 'sent',
        sentAt: new Date(),
      });
      return;
    }

    if (row.category === 'marketing') {
      const allowed = await this.consent.isEmailMarketingAllowed(row.userId);
      if (!allowed) {
        await this.messagesRepo.update(row.id, { status: 'suppressed' });
        return;
      }
    }

    if (!this.canSendEmailNow()) {
      await this.messagesRepo.update(row.id, { status: 'pending' });
      return;
    }

    const email = await this.send.resolveUserEmail(row.userId);
    if (!email) {
      await this.messagesRepo.update(row.id, {
        status: 'failed',
        lastError: 'Email utilisateur absent',
      });
      return;
    }

    if (!this.mailer.isConfigured()) {
      await this.messagesRepo.update(row.id, {
        status: 'failed',
        lastError: 'Aucun transport email (SES ou SMTP) configuré',
      });
      return;
    }

    const firstName = await this.send.resolveFirstName(row.userId);
    const fontDataUri = await this.fonts.getFontDataUri();
    const token = await this.consent.getUnsubscribeTokenForUser(row.userId);

    const rendered = this.renderer.renderEmail({
      template,
      variables: row.variables,
      firstName,
      fontDataUri,
      unsubscribeToken: token,
      managePreferencesUrl: MANAGE_PREFS_URL,
    });

    const messageId = await this.mailer.send({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      unsubscribeToken: template.category === 'marketing' ? token : null,
      tags: {
        userId: row.userId,
        templateKey: row.templateKey,
        outboundMessageId: row.id,
        campaignKey: row.dispatchId ?? 'single',
      },
    });

    if (!messageId) {
      await this.messagesRepo.update(row.id, {
        status: 'failed',
        lastError: 'Envoi email refusé par le transport',
      });
      return;
    }

    await this.messagesRepo.update(row.id, {
      status: 'sent',
      sentAt: new Date(),
      providerMessageId: messageId,
    });

    await this.analytics.track(row.userId, 'email_sent', {
      template_key: row.templateKey,
      channel: 'email',
    });
  }
}
