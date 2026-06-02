import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialModule } from '../social/social.module.js';
import { UserPresenceEntity } from './entities/user-presence.entity.js';
import { PresenceController } from './presence.controller.js';
import { PresenceService } from './presence.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPresenceEntity]),
    SocialModule,
  ],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
