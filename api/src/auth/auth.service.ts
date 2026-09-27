import {
  BadRequestException,
  GoneException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { SessionEntity } from './entities/session.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { AccountDeletionFeedbackEntity } from './entities/account-deletion-feedback.entity.js';
import { InvitesService } from '../social/invites.service.js';
import { ReferralService } from '../social/referral.service.js';
import { RedditConversionsService } from '../analytics/reddit-conversions.service.js';
import type { RedditAdsRequestContext } from '../analytics/reddit-conversions.js';
import { DeviceTokenEntity } from '../notifications/entities/device-token.entity.js';
import { AccountDeletionMailService } from './account-deletion-mail.service.js';

type AuthUser = { id: string; email: string | null };
type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  isNewUser?: boolean;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionsRepo: Repository<SessionEntity>,
    @InjectRepository(AccountDeletionFeedbackEntity)
    private readonly deletionFeedbackRepo: Repository<AccountDeletionFeedbackEntity>,
    @InjectRepository(DeviceTokenEntity)
    private readonly deviceTokensRepo: Repository<DeviceTokenEntity>,
    private jwt: JwtService,
    private config: ConfigService,
    private invites: InvitesService,
    private referrals: ReferralService,
    private redditConversions: RedditConversionsService,
    private accountDeletionMail: AccountDeletionMailService,
  ) {}

  private async signAccessToken(user: AuthUser): Promise<string> {
    const secret = this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
    const expiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m') as JwtSignOptions['expiresIn'];
    return await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret,
        expiresIn,
      },
    );
  }

  /** Format: `{selector}.{secret}` — selector indexé, secret hashé (argon2). */
  private createRefreshTokenParts(): {
    refreshToken: string;
    selector: string;
    secret: string;
  } {
    const selector = randomBytes(16).toString('base64url');
    const secret = randomBytes(32).toString('base64url');
    return {
      refreshToken: `${selector}.${secret}`,
      selector,
      secret,
    };
  }

  private async issueSession(params: {
    user: AuthUser;
    deviceId?: string;
    isNewUser?: boolean;
  }): Promise<AuthSession> {
    const { refreshToken, selector, secret } = this.createRefreshTokenParts();
    const refreshTokenHash = await argon2.hash(secret);
    await this.sessionsRepo.save({
      userId: params.user.id,
      selector,
      refreshTokenHash,
      deviceId: params.deviceId ?? null,
    });
    const accessToken = await this.signAccessToken(params.user);
    return {
      accessToken,
      refreshToken,
      user: params.user,
      ...(params.isNewUser != null ? { isNewUser: params.isNewUser } : {}),
    };
  }

  async createSessionForUser(params: {
    userId: string;
    email: string | null;
    deviceId?: string;
    isNewUser?: boolean;
  }): Promise<AuthSession> {
    return await this.issueSession({
      user: { id: params.userId, email: params.email },
      deviceId: params.deviceId,
      isNewUser: params.isNewUser,
    });
  }

  async registerWithEmail(params: {
    email: string;
    password: string;
    deviceId?: string;
    inviteCode?: string;
    firstName?: string;
    lastName?: string;
    username: string;
    weightKg?: number;
    heightCm?: number;
    gender?: 'male' | 'female';
    ageYears?: number;
    trainingGoal?: string;
    trainingExperience?: string;
    sessionsPerWeek?: string;
    ads?: RedditAdsRequestContext;
  }): Promise<AuthSession> {
    const email = params.email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({
      where: { email, deletedAt: IsNull() },
    });
    if (existing) throw new BadRequestException('Cet email est déjà utilisé');

    const softDeleted = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'deletedAt'],
    });
    if (softDeleted?.deletedAt) {
      throw new BadRequestException(
        'Cet email est associé à un compte supprimé. Contacte le support.',
      );
    }

    const passwordHash = await argon2.hash(params.password);
    const user = await this.usersRepo.save({
      email,
      password: passwordHash,
    });
    await this.invites.createDefaultProfile(user.id, {
      firstName: params.firstName?.trim() || null,
      lastName: params.lastName?.trim() || null,
      username: params.username,
      email: user.email,
      weightKg: params.weightKg,
      heightCm: params.heightCm,
      gender: params.gender,
      ageYears: params.ageYears,
      trainingGoal: params.trainingGoal,
      trainingExperience: params.trainingExperience,
      sessionsPerWeek: params.sessionsPerWeek,
    });
    await this.referrals.applyReferralCodeOnSignup({
      newUserId: user.id,
      inviteCode: params.inviteCode,
    });
    void this.redditConversions.scheduleSignUp({
      isNewUser: true,
      userId: user.id,
      email: user.email,
      ...params.ads,
    });
    return await this.issueSession({
      user: { id: user.id, email: user.email },
      deviceId: params.deviceId,
      isNewUser: true,
    });
  }

  async loginWithEmail(params: {
    email: string;
    password: string;
    deviceId?: string;
  }): Promise<AuthSession> {
    const email = params.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({
      where: { email, deletedAt: IsNull() },
      select: ['id', 'email', 'password', 'deletedAt'],
    });
    if (!user || !user.password)
      throw new UnauthorizedException('Identifiants invalides');
    const ok = await argon2.verify(user.password, params.password);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');

    return await this.issueSession({
      user: { id: user.id, email: user.email },
      deviceId: params.deviceId,
      isNewUser: false,
    });
  }

  async refresh(params: {
    refreshToken: string;
    deviceId?: string;
  }): Promise<AuthSession> {
    const match = await this.findSessionByRefreshToken(params.refreshToken);
    if (!match) throw new UnauthorizedException('Session expirée');
    if (match.user.deletedAt) {
      await this.sessionsRepo.update({ id: match.id }, { revokedAt: new Date() });
      throw new UnauthorizedException('Compte désactivé');
    }

    await this.sessionsRepo.update({ id: match.id }, { revokedAt: new Date() });

    const user: AuthUser = { id: match.user.id, email: match.user.email };
    return await this.issueSession({ user, deviceId: params.deviceId });
  }

  async logout(params: { refreshToken: string }): Promise<void> {
    const match = await this.findSessionByRefreshToken(params.refreshToken);
    if (!match) return;
    await this.sessionsRepo.update({ id: match.id }, { revokedAt: new Date() });
  }

  async me(userId: string): Promise<AuthUser> {
    const u = await this.usersRepo.findOne({
      where: { id: userId, deletedAt: IsNull() },
      select: ['id', 'email'],
    });
    if (!u) throw new UnauthorizedException();
    return { id: u.id, email: u.email };
  }

  async deleteAccount(
    userId: string,
    params: { comment?: string } = {},
  ): Promise<{ ok: true }> {
    const comment = params.comment?.trim() || null;

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'deletedAt'],
    });
    if (!user) throw new UnauthorizedException();
    if (user.deletedAt) {
      throw new GoneException('Compte déjà supprimé');
    }

    const now = new Date();
    await this.usersRepo.update({ id: userId }, { deletedAt: now });
    await this.sessionsRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: now },
    );
    await this.deviceTokensRepo.delete({ userId });
    await this.deletionFeedbackRepo.save({
      userId,
      comment,
    });

    if (user.email) {
      const profile = await this.profilesRepo.findOne({
        where: { userId },
        select: ['firstName'],
      });
      try {
        await this.accountDeletionMail.sendConfirmation({
          to: user.email,
          firstName: profile?.firstName ?? null,
        });
      } catch (err) {
        this.logger.warn(
          `Email confirmation suppression échoué pour ${userId}`,
          err,
        );
      }
    }

    return { ok: true };
  }

  private async findSessionByRefreshToken(
    refreshToken: string,
  ): Promise<SessionEntity | null> {
    const trimmed = refreshToken.trim();
    if (!trimmed) return null;

    const separator = trimmed.indexOf('.');
    if (separator > 0) {
      const selector = trimmed.slice(0, separator);
      const secret = trimmed.slice(separator + 1);
      if (!selector || !secret) return null;

      const session = await this.sessionsRepo.findOne({
        where: { selector, revokedAt: IsNull() },
        relations: { user: true },
      });
      if (!session) return null;

      try {
        const ok = await argon2.verify(session.refreshTokenHash, secret);
        return ok ? session : null;
      } catch {
        return null;
      }
    }

    // Legacy: UUID sans selector (pré-migration). Scan limité aux lignes sans selector.
    const legacy = await this.sessionsRepo.find({
      where: { selector: IsNull(), revokedAt: IsNull() },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    for (const session of legacy) {
      try {
        const ok = await argon2.verify(session.refreshTokenHash, trimmed);
        if (ok) return session;
      } catch {
        // ignore
      }
    }
    return null;
  }

  async identifyEmail(emailRaw: string): Promise<{ exists: boolean }> {
    const email = emailRaw.trim().toLowerCase();
    if (!email) return { exists: false };
    const existing = await this.usersRepo.findOne({
      where: { email, deletedAt: IsNull() },
      select: ['id'],
    });
    return { exists: Boolean(existing) };
  }
}
