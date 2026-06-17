import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { AccessService } from './access.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfileEntity, TrackedExerciseEntity]),
  ],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
