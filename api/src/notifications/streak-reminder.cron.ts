import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OutboundSendService } from '../outbound/dispatch/outbound-send.service.js';
import { MarketingMessageVarsService } from '../outbound/lib/marketing-message-vars.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { isEveningWindow } from './lib/timezone.js';

@Injectable()
export class StreakReminderCron {
  private readonly logger = new Logger(StreakReminderCron.name);

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
        if (!isEveningWindow(timezone, 18, 20)) continue;
        const userIds = await this.deviceTokens.listUserIdsByTimezone(timezone);
        for (const userId of userIds) {
          const vars = await this.marketingVars.streakAtRiskVariables(
            userId,
            timezone,
          );
          if (!vars) continue;
          await this.outboundSend.queueSend({
            userId,
            templateKey: 'streak_at_risk',
            variables: vars,
            channel: 'push',
            idempotencyKey: `streak:${vars.today}`,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Streak reminder cron failed: ${String(err)}`);
    }
  }
}
