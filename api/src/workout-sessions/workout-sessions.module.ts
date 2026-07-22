import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PerformanceEntriesModule } from '../performance/performance-entries.module.js';
import { PresenceModule } from '../presence/presence.module.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { SocialModule } from '../social/social.module.js';
import { TrackedExercisesModule } from '../tracked-exercises/tracked-exercises.module.js';
import { SessionCommentEntity } from './entities/session-comment.entity.js';
import { SessionReactionEntity } from './entities/session-reaction.entity.js';
import { WorkoutSessionsController } from './workout-sessions.controller.js';
import { WorkoutSessionsService } from './workout-sessions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionCommentEntity,
      SessionReactionEntity,
      UserProfileEntity,
    ]),
    SocialModule,
    PerformanceEntriesModule,
    TrackedExercisesModule,
    PresenceModule,
    RealtimeModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService],
  exports: [WorkoutSessionsService],
})
export class WorkoutSessionsModule {}
