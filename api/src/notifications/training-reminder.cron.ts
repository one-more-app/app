import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceTokensService } from './device-tokens.service.js';
import {
  localHour,
  localIsoWeekday,
  localMinute,
  normalizeLocalHour,
} from './lib/timezone.js';
import { NotificationDispatchService } from './notification-dispatch.service.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';

@Injectable()
export class TrainingReminderCron {
  private readonly logger = new Logger(TrainingReminderCron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly prefs: NotificationPreferencesService,
    private readonly dispatch: NotificationDispatchService,
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
          await this.dispatch.sendTrainingReminderForUser(userId, timezone);
        }
      }
    } catch (err) {
      this.logger.warn(`Training reminder cron failed: ${String(err)}`);
    }
  }
}
