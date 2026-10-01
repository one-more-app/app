import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntriesModule } from '../performance/performance-entries.module.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { LeagueModule } from '../league/league.module.js';
import { ProgressModule } from '../progress/progress.module.js';
import { TrackedExercisesModule } from '../tracked-exercises/tracked-exercises.module.js';
import { AccessModule } from './access.module.js';
import { FriendSuggestionsService } from './friend-suggestions.service.js';
import { FriendsService } from './friends.service.js';
import { InvitesService } from './invites.service.js';
import { ReferralService } from './referral.service.js';
import { ReferralRewardService } from './referral-reward.service.js';
import { UserSearchService } from './user-search.service.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { UserGymEntity } from '../gyms/entities/user-gym.entity.js';
import { SocialController } from './social.controller.js';
import { UsernameService } from './username.service.js';
import { BillingModule } from '../billing/billing.module.js';
import { RewardsModule } from '../rewards/rewards.module.js';
import { ReferralProGrantEntity } from '../rewards/entities/referral-pro-grant.entity.js';

@Module({
  imports: [
    AccessModule,
    TypeOrmModule.forFeature([
      FriendshipEntity,
      UserProfileEntity,
      UserEntity,
      UserGymEntity,
      ReferralProGrantEntity,
    ]),
    ProgressModule,
    LeagueModule,
    TrackedExercisesModule,
    PerformanceEntriesModule,
    BillingModule,
    RewardsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [SocialController],
  providers: [
    InvitesService,
    FriendsService,
    FriendSuggestionsService,
    ReferralService,
    ReferralRewardService,
    UserSearchService,
    UsernameService,
  ],
  exports: [
    AccessModule,
    InvitesService,
    FriendsService,
    ReferralService,
    ReferralRewardService,
    UsernameService,
  ],
})
export class SocialModule {}
