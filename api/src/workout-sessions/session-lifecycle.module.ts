import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { WorkoutSessionEntity } from './entities/workout-session.entity.js';
import { SessionLifecycleService } from './session-lifecycle.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutSessionEntity, PerformanceEntryEntity]),
  ],
  providers: [SessionLifecycleService],
  exports: [SessionLifecycleService, TypeOrmModule],
})
export class SessionLifecycleModule {}
