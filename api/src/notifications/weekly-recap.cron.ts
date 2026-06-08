import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceTokensService } from './device-tokens.service.js';
import { isSundayEvening } from './lib/timezone.js';
import { NotificationDispatchService } from './notification-dispatch.service.js';

@Injectable()
export class WeeklyRecapCron {
  private readonly logger = new Logger(WeeklyRecapCron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  @Cron('0 * * * *')
  async runHourly() {
    try {
      const timezones = await this.deviceTokens.listDistinctTimezones();
      for (const timezone of timezones) {
        if (!isSundayEvening(timezone)) continue;
        const userIds = await this.deviceTokens.listUserIdsByTimezone(timezone);
        for (const userId of userIds) {
          await this.dispatch.sendWeeklyRecapForUser(userId, timezone);
        }
      }
    } catch (err) {
      this.logger.warn(`Weekly recap cron failed: ${String(err)}`);
    }
  }
}
