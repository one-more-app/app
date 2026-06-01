import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntriesModule } from '../performance/performance-entries.module.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { ProgressModule } from '../progress/progress.module.js';
import { TrackedExercisesModule } from '../tracked-exercises/tracked-exercises.module.js';
import { AccessModule } from './access.module.js';
import { FriendsService } from './friends.service.js';
import { InvitesService } from './invites.service.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { SocialController } from './social.controller.js';

@Module({
  imports: [
    AccessModule,
    TypeOrmModule.forFeature([FriendshipEntity, UserProfileEntity]),
    ProgressModule,
    TrackedExercisesModule,
    PerformanceEntriesModule,
  ],
  controllers: [SocialController],
  providers: [InvitesService, FriendsService],
  exports: [AccessModule, InvitesService],
})
export class SocialModule {}
