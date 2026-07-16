import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntriesModule } from '../performance/performance-entries.module.js';
import { PresenceModule } from '../presence/presence.module.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { SocialModule } from '../social/social.module.js';
import { TrackedExercisesModule } from '../tracked-exercises/tracked-exercises.module.js';
import { SessionCommentEntity } from './entities/session-comment.entity.js';
import { WorkoutSessionsController } from './workout-sessions.controller.js';
import { WorkoutSessionsService } from './workout-sessions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionCommentEntity, UserProfileEntity]),
    SocialModule,
    PerformanceEntriesModule,
    TrackedExercisesModule,
    PresenceModule,
    RealtimeModule,
  ],
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService],
  exports: [WorkoutSessionsService],
})
export class WorkoutSessionsModule {}
