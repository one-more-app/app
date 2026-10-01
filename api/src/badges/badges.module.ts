import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { BadgesController } from './badges.controller.js';
import { BadgesService } from './badges.service.js';
import { UserBadgeEntity } from './entities/user-badge.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserBadgeEntity, FriendshipEntity])],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
