import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceTokensService } from './device-tokens.service.js';
import {
  isNewUserD1ReferralDue,
  isNewUserD1TrainingSlot,
  previousLocalDateKey,
} from './lib/new-user-d1.js';
import { localHour, normalizeLocalHour } from './lib/timezone.js';
import { NotificationDispatchService } from './notification-dispatch.service.js';

@Injectable()
export class NewUserD1Cron {
  private readonly logger = new Logger(NewUserD1Cron.name);

  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly dispatch: NotificationDispatchService,
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
          for (const userId of cohortIds) {
            await this.dispatch.sendNewUserD1TrainingForUser(
              userId,
              timezone,
              trainingHour,
            );
          }
        }

        if (!inMiddayWindow) continue;
        for (const userId of cohortIds) {
          if (!isNewUserD1ReferralDue(userId, timezone)) continue;
          await this.dispatch.sendNewUserD1ReferralForUser(userId);
        }
      }
    } catch (err) {
      this.logger.warn(`New user D+1 cron failed: ${String(err)}`);
    }
  }
}
