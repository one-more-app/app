import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from '../social/access.module.js';
import { TshirtRewardClaimEntity } from './entities/tshirt-reward-claim.entity.js';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard.js';
import {
  AdminRewardsController,
  RewardsController,
} from './rewards.controller.js';
import { RewardsService } from './rewards.service.js';

@Module({
  imports: [AccessModule, TypeOrmModule.forFeature([TshirtRewardClaimEntity])],
  controllers: [RewardsController, AdminRewardsController],
  providers: [RewardsService, AdminApiKeyGuard],
  exports: [RewardsService],
})
export class RewardsModule {}
