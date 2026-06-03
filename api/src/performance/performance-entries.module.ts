import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeagueModule } from '../league/league.module.js';
import { ProgressModule } from '../progress/progress.module.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { PerformanceEntryEntity } from './performance-entry.entity.js';
import { PerformanceEntriesController } from './performance-entries.controller.js';
import { PerformanceEntriesService } from './performance-entries.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerformanceEntryEntity, TrackedExerciseEntity]),
    ProgressModule,
    LeagueModule,
  ],
  controllers: [PerformanceEntriesController],
  providers: [PerformanceEntriesService],
  exports: [PerformanceEntriesService, TypeOrmModule],
})
export class PerformanceEntriesModule {}
