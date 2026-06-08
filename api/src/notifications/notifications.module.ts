import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserProgressEntity } from '../progress/entities/user-progress.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { PresenceModule } from '../presence/presence.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { FriendTrainingAlertEntity } from './entities/friend-training-alert.entity.js';
import { DeviceTokenEntity } from './entities/device-token.entity.js';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity.js';
import { NotificationPreferencesEntity } from './entities/notification-preferences.entity.js';
import { FriendTrainingAlertsService } from './friend-training-alerts.service.js';
import { NotificationDispatchService } from './notification-dispatch.service.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationsController } from './notifications.controller.js';
import { PushNotificationService } from './push-notification.service.js';
import { StreakReminderCron } from './streak-reminder.cron.js';
import { WeeklyRecapCron } from './weekly-recap.cron.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      DeviceTokenEntity,
      NotificationPreferencesEntity,
      NotificationDeliveryEntity,
      FriendTrainingAlertEntity,
      FriendshipEntity,
      UserProfileEntity,
      UserProgressEntity,
      PerformanceEntryEntity,
      XpEventEntity,
    ]),
    PresenceModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [NotificationsController],
  providers: [
    DeviceTokensService,
    NotificationPreferencesService,
    PushNotificationService,
    FriendTrainingAlertsService,
    NotificationDispatchService,
    StreakReminderCron,
    WeeklyRecapCron,
  ],
  exports: [NotificationDispatchService, FriendTrainingAlertsService],
})
export class NotificationsModule {}
