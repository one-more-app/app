import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OutboundSendService } from '../outbound/dispatch/outbound-send.service.js';
import { MarketingMessageVarsService } from '../outbound/lib/marketing-message-vars.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { isSundayEvening } from './lib/timezone.js';

@Injectable()
export class WeeklyRecapCron {
  private readonly logger = new Logger(WeeklyRecapCron.name);

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
        if (!isSundayEvening(timezone)) continue;
        const userIds = await this.deviceTokens.listUserIdsByTimezone(timezone);
        for (const userId of userIds) {
          const vars = await this.marketingVars.weeklyRecapVariables(
            userId,
            timezone,
          );
          await this.outboundSend.queueSend({
            userId,
            templateKey: 'weekly_recap',
            variables: vars,
            channel: 'push',
            idempotencyKey: `recap:${vars.weekKey}`,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Weekly recap cron failed: ${String(err)}`);
    }
  }
}
