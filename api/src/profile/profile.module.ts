import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingModule } from '../billing/billing.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { SocialModule } from '../social/social.module.js';
import { UserProfileEntity } from './user-profile.entity.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfileEntity]),
    BillingModule,
    SocialModule,
    StorageModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [TypeOrmModule, ProfileService],
})
export class ProfileModule {}
