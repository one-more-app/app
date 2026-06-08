import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceTokensService } from './device-tokens.service.js';
import { isEveningWindow } from './lib/timezone.js';
import { NotificationDispatchService } from './notification-dispatch.service.js';

@Injectable()
export class StreakReminderCron {
  private readonly logger = new Logger(StreakReminderCron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  @Cron('0 * * * *')
  async runHourly() {
    try {
      const timezones = await this.deviceTokens.listDistinctTimezones();
      for (const timezone of timezones) {
        if (!isEveningWindow(timezone, 18, 20)) continue;
        const userIds = await this.deviceTokens.listUserIdsByTimezone(timezone);
        for (const userId of userIds) {
          await this.dispatch.sendStreakAtRiskForUser(userId, timezone);
        }
      }
    } catch (err) {
      this.logger.warn(`Streak reminder cron failed: ${String(err)}`);
    }
  }
}
