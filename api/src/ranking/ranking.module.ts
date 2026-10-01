import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { UserGymEntity } from '../gyms/entities/user-gym.entity.js';
import { LeagueModule } from '../league/league.module.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { RankingController } from './ranking.controller.js';
import { RankingService } from './ranking.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      XpEventEntity,
      FriendshipEntity,
      UserGymEntity,
      UserProfileEntity,
      UserEntity,
    ]),
    LeagueModule,
  ],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
