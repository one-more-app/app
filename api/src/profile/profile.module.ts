import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialModule } from '../social/social.module.js';
import { UserProfileEntity } from './user-profile.entity.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfileEntity]), SocialModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [TypeOrmModule, ProfileService],
})
export class ProfileModule {}
