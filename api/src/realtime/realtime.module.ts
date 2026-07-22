import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from '../messaging/entities/conversation.entity.js';
import { PresenceModule } from '../presence/presence.module.js';
import { SocialModule } from '../social/social.module.js';
import { RealtimeBroadcaster } from './realtime-broadcaster.service.js';
import { RealtimeGateway } from './realtime.gateway.js';
import { WsJwtGuard } from './ws-jwt.guard.js';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret',
      }),
    }),
    TypeOrmModule.forFeature([ConversationEntity]),
    forwardRef(() => SocialModule),
    PresenceModule,
  ],
  providers: [RealtimeGateway, RealtimeBroadcaster, WsJwtGuard],
  exports: [RealtimeBroadcaster],
})
export class RealtimeModule {}
