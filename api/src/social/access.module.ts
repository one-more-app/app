import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { AccessService } from './access.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfileEntity,
      TrackedExerciseEntity,
      UserEntity,
    ]),
  ],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
