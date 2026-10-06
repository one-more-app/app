import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OutboundSendService } from '../outbound/dispatch/outbound-send.service.js';
import { MarketingMessageVarsService } from '../outbound/lib/marketing-message-vars.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { isMonthlyRankingRecapWindow } from './lib/timezone.js';

@Injectable()
export class MonthlyRankingRecapCron {
  private readonly logger = new Logger(MonthlyRankingRecapCron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly outboundSend: OutboundSendService,
    private readonly marketingVars: MarketingMessageVarsService,
  ) {}

  @Cron('0 * * * *')
  async runHourly() {
    try {
      const timezones = await this.deviceTokens.listDistinctTimezones();
      for (const timezone of timezones) {
        if (!isMonthlyRankingRecapWindow(timezone)) continue;
        const userIds = await this.deviceTokens.listUserIdsByTimezone(timezone);
        for (const userId of userIds) {
          const vars = await this.marketingVars.monthlyRankingRecapVariables(
            userId,
            timezone,
          );
          if (!vars) continue;
          await this.outboundSend.queueSend({
            userId,
            templateKey: 'monthly_ranking_recap',
            variables: vars,
            channel: 'push',
            idempotencyKey: `ranking_recap:${vars.month}`,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Monthly ranking recap cron failed: ${String(err)}`);
    }
  }
}
