import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { TypeormDatabaseModule } from './database/typeorm.module.js';
import { ExercisesModule } from './exercises/exercises.module.js';
import { PerformanceEntriesModule } from './performance/performance-entries.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { TrackedExercisesModule } from './tracked-exercises/tracked-exercises.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { SocialModule } from './social/social.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { PresenceModule } from './presence/presence.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { LeagueModule } from './league/league.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { BillingModule } from './billing/billing.module.js';
import { RewardsModule } from './rewards/rewards.module.js';
import { StorageModule } from './storage/storage.module.js';
import { GymsModule } from './gyms/gyms.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { WorkoutSessionsModule } from './workout-sessions/workout-sessions.module.js';
import { PublicStatsModule } from './public-stats/public-stats.module.js';
import { EventModule } from './event/event.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['api/.env', '.env'],
    }),
    StorageModule,
    TypeormDatabaseModule,
    AuthModule,
    ProfileModule,
    TrackedExercisesModule,
    PerformanceEntriesModule,
    ExercisesModule,
    ProgressModule,
    SocialModule,
    MessagingModule,
    PresenceModule,
    RealtimeModule,
    LeagueModule,
    NotificationsModule,
    AnalyticsModule,
    BillingModule,
    RewardsModule,
    GymsModule,
    AddressesModule,
    WorkoutSessionsModule,
    PublicStatsModule,
    EventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
