import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { LeagueModule } from '../league/league.module.js';
import { AccessModule } from '../social/access.module.js';
import { TrackedExerciseEntity } from './tracked-exercise.entity.js';
import { TrackedExercisesController } from './tracked-exercises.controller.js';
import { TrackedExercisesService } from './tracked-exercises.service.js';

@Module({
  imports: [
    AccessModule,
    LeagueModule,
    TypeOrmModule.forFeature([TrackedExerciseEntity, PerformanceEntryEntity]),
  ],
  controllers: [TrackedExercisesController],
  providers: [TrackedExercisesService],
  exports: [TrackedExercisesService, TypeOrmModule],
})
export class TrackedExercisesModule {}
