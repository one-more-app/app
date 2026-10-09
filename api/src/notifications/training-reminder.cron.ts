import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OutboundSendService } from '../outbound/dispatch/outbound-send.service.js';
import { MarketingMessageVarsService } from '../outbound/lib/marketing-message-vars.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import {
  localHour,
  localIsoWeekday,
  localMinute,
  normalizeLocalHour,
} from './lib/timezone.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';

@Injectable()
export class TrainingReminderCron {
  private readonly logger = new Logger(TrainingReminderCron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly prefs: NotificationPreferencesService,
    private readonly outboundSend: OutboundSendService,
    private readonly marketingVars: MarketingMessageVarsService,
  ) {}

  @Cron('* * * * *')
  async runEveryMinute() {
    try {
      const timezones = await this.deviceTokens.listDistinctTimezones();
      for (const timezone of timezones) {
        const hour = normalizeLocalHour(localHour(timezone));
        const minute = localMinute(timezone);
        const weekday = localIsoWeekday(timezone);
        const dueIds = await this.prefs.listUserIdsDueForTrainingReminder(
          hour,
          minute,
          weekday,
        );
        if (dueIds.length === 0) continue;
        const tokenUserIds = new Set(
          await this.deviceTokens.listUserIdsByTimezone(timezone),
        );
        for (const userId of dueIds) {
          if (!tokenUserIds.has(userId)) continue;
          const vars = await this.marketingVars.trainingReminderEligible(
            userId,
            timezone,
          );
          if (!vars) continue;
          await this.outboundSend.queueSend({
            userId,
            templateKey: 'training_reminder',
            variables: vars,
            channel: 'push',
            idempotencyKey: `training_reminder:${vars.today}`,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Training reminder cron failed: ${String(err)}`);
    }
  }
}
