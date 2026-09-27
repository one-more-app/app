import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccountDeletionMailService } from './account-deletion-mail.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { OAuthController } from './oauth.controller.js';
import { OAuthService } from './oauth.service.js';
import { AccountDeletionFeedbackEntity } from './entities/account-deletion-feedback.entity.js';
import { OAuthAccountEntity } from './entities/oauth-account.entity.js';
import { SessionEntity } from './entities/session.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { DeviceTokenEntity } from '../notifications/entities/device-token.entity.js';
import { SocialModule } from '../social/social.module.js';
import { ProfileModule } from '../profile/profile.module.js';

@Module({
  imports: [
    SocialModule,
    ProfileModule,
    TypeOrmModule.forFeature([
      UserEntity,
      UserProfileEntity,
      SessionEntity,
      OAuthAccountEntity,
      AccountDeletionFeedbackEntity,
      DeviceTokenEntity,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OAuthService,
    AccountDeletionMailService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
