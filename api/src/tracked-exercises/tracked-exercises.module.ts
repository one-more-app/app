import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from './tracked-exercise.entity.js';
import { TrackedExercisesController } from './tracked-exercises.controller.js';
import { TrackedExercisesService } from './tracked-exercises.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackedExerciseEntity, PerformanceEntryEntity]),
  ],
  controllers: [TrackedExercisesController],
  providers: [TrackedExercisesService],
  exports: [TypeOrmModule],
})
export class TrackedExercisesModule {}
