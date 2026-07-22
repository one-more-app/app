import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { RewardsModule } from '../rewards/rewards.module.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { RevenueCatWebhookGuard } from './guards/revenuecat-webhook.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserProfileEntity]),
    AnalyticsModule,
    RewardsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, RevenueCatWebhookGuard],
  exports: [BillingService],
})
export class BillingModule {}
