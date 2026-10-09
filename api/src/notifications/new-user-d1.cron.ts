import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OutboundSendService } from '../outbound/dispatch/outbound-send.service.js';
import { MarketingMessageVarsService } from '../outbound/lib/marketing-message-vars.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import {
  isNewUserD1ReferralDue,
  isNewUserD1TrainingSlot,
  previousLocalDateKey,
} from './lib/new-user-d1.js';
import { localHour, normalizeLocalHour } from './lib/timezone.js';

@Injectable()
export class NewUserD1Cron {
  private readonly logger = new Logger(NewUserD1Cron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly outboundSend: OutboundSendService,
    private readonly marketingVars: MarketingMessageVarsService,
  ) {}

  @Cron('* * * * *')
  async runEveryMinute() {
    try {
      const timezones = await this.deviceTokens.listDistinctTimezones();
      for (const timezone of timezones) {
        const trainingHour = isNewUserD1TrainingSlot(timezone);
        const hour = normalizeLocalHour(localHour(timezone));
        const inMiddayWindow = hour === 12 || hour === 13;
        if (trainingHour === null && !inMiddayWindow) continue;

        const signupLocalDate = previousLocalDateKey(timezone);
        const cohortIds = await this.deviceTokens.listUserIdsCreatedOnLocalDate(
          timezone,
          signupLocalDate,
        );
        if (cohortIds.length === 0) continue;

        if (trainingHour !== null) {
          const templateByHour: Record<number, string> = {
            7: 'new_user_d1_morning',
            11: 'new_user_d1_midday_train',
            16: 'new_user_d1_evening',
          };
          const templateKey = templateByHour[trainingHour];
          if (templateKey) {
            for (const userId of cohortIds) {
              const eligible =
                await this.marketingVars.trainingReminderEligible(
                  userId,
                  timezone,
                );
              if (!eligible) continue;
              await this.outboundSend.queueSend({
                userId,
                templateKey,
                channel: 'push',
                idempotencyKey: `${templateKey}:${userId}`,
              });
            }
          }
        }

        if (!inMiddayWindow) continue;
        for (const userId of cohortIds) {
          if (!isNewUserD1ReferralDue(userId, timezone)) continue;
          await this.outboundSend.queueSend({
            userId,
            templateKey: 'new_user_d1_referral',
            channel: 'push',
            idempotencyKey: `new_user_d1_referral:${userId}`,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`New user D+1 cron failed: ${String(err)}`);
    }
  }
}
