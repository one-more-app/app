import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AccessModule } from '../social/access.module.js';
import { TshirtRewardClaimEntity } from './entities/tshirt-reward-claim.entity.js';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard.js';
import { NotionRewardsWebhookController } from './notion-rewards-webhook.controller.js';
import { NotionRewardsWebhookService } from './notion-rewards-webhook.service.js';
import {
  AdminRewardsController,
  RewardsController,
} from './rewards.controller.js';
import { RewardsService } from './rewards.service.js';

@Module({
  imports: [
    AccessModule,
    NotificationsModule,
    TypeOrmModule.forFeature([TshirtRewardClaimEntity]),
  ],
  controllers: [
    RewardsController,
    AdminRewardsController,
    NotionRewardsWebhookController,
  ],
  providers: [RewardsService, AdminApiKeyGuard, NotionRewardsWebhookService],
  exports: [RewardsService],
})
export class RewardsModule {}
