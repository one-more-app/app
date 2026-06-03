import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { LeagueController } from './league.controller.js';
import { LeagueService } from './league.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfileEntity,
      TrackedExerciseEntity,
      PerformanceEntryEntity,
    ]),
  ],
  controllers: [LeagueController],
  providers: [LeagueService],
  exports: [LeagueService],
})
export class LeagueModule {}
