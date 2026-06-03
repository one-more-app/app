import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntriesModule } from '../performance/performance-entries.module.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { LeagueModule } from '../league/league.module.js';
import { ProgressModule } from '../progress/progress.module.js';
import { TrackedExercisesModule } from '../tracked-exercises/tracked-exercises.module.js';
import { AccessModule } from './access.module.js';
import { FriendsService } from './friends.service.js';
import { InvitesService } from './invites.service.js';
import { UserSearchService } from './user-search.service.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { SocialController } from './social.controller.js';
import { UsernameService } from './username.service.js';

@Module({
  imports: [
    AccessModule,
    TypeOrmModule.forFeature([FriendshipEntity, UserProfileEntity, UserEntity]),
    ProgressModule,
    LeagueModule,
    TrackedExercisesModule,
    PerformanceEntriesModule,
  ],
  controllers: [SocialController],
  providers: [InvitesService, FriendsService, UserSearchService, UsernameService],
  exports: [AccessModule, InvitesService, FriendsService, UsernameService],
})
export class SocialModule {}
