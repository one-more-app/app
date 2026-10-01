import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceTokensService } from './device-tokens.service.js';
import { isMonthlyRankingRecapWindow } from './lib/timezone.js';
import { NotificationDispatchService } from './notification-dispatch.service.js';

@Injectable()
export class MonthlyRankingRecapCron {
  private readonly logger = new Logger(MonthlyRankingRecapCron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  @Cron('0 * * * *')
  async runHourly() {
    try {
      const timezones = await this.deviceTokens.listDistinctTimezones();
      for (const timezone of timezones) {
        if (!isMonthlyRankingRecapWindow(timezone)) continue;
        const userIds = await this.deviceTokens.listUserIdsByTimezone(timezone);
        for (const userId of userIds) {
          await this.dispatch.sendMonthlyRankingRecapForUser(userId, timezone);
        }
      }
    } catch (err) {
      this.logger.warn(`Monthly ranking recap cron failed: ${String(err)}`);
    }
  }
}
