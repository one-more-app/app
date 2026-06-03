import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { XpEventEntity } from './entities/xp-event.entity.js';
import { UserProgressEntity } from './entities/user-progress.entity.js';
import { LeagueModule } from '../league/league.module.js';
import { ProgressController } from './progress.controller.js';
import { ProgressService } from './progress.service.js';

@Module({
  imports: [
    LeagueModule,
    TypeOrmModule.forFeature([
      UserProgressEntity,
      XpEventEntity,
      UserProfileEntity,
      PerformanceEntryEntity,
      TrackedExerciseEntity,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
