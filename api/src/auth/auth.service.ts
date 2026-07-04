import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { SessionEntity } from './entities/session.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { InvitesService } from '../social/invites.service.js';
import { ReferralService } from '../social/referral.service.js';

type AuthUser = { id: string; email: string | null };
type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionsRepo: Repository<SessionEntity>,
    private jwt: JwtService,
    private config: ConfigService,
    private invites: InvitesService,
    private referrals: ReferralService,
  ) {}

  private async signAccessToken(user: AuthUser): Promise<string> {
    const secret = this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );
  }

  private async issueSession(params: {
    user: AuthUser;
    deviceId?: string;
  }): Promise<AuthSession> {
    const refreshToken = randomUUID();
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.sessionsRepo.save({
      userId: params.user.id,
      refreshTokenHash,
      deviceId: params.deviceId ?? null,
    });
    const accessToken = await this.signAccessToken(params.user);
    return { accessToken, refreshToken, user: params.user };
  }

  async createSessionForUser(params: {
    userId: string;
    email: string | null;
    deviceId?: string;
  }): Promise<AuthSession> {
    return await this.issueSession({
      user: { id: params.userId, email: params.email },
      deviceId: params.deviceId,
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
  }): Promise<AuthSession> {
    const email = params.email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Cet email est déjà utilisé');

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
    });
    await this.referrals.applyReferralCodeOnSignup({
      newUserId: user.id,
      inviteCode: params.inviteCode,
    });
    return await this.issueSession({
      user: { id: user.id, email: user.email },
      deviceId: params.deviceId,
    });
  }

  async loginWithEmail(params: {
    email: string;
    password: string;
    deviceId?: string;
  }): Promise<AuthSession> {
    const email = params.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });
    if (!user || !user.password)
      throw new UnauthorizedException('Identifiants invalides');
    const ok = await argon2.verify(user.password, params.password);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');

    return await this.issueSession({
      user: { id: user.id, email: user.email },
      deviceId: params.deviceId,
    });
  }

  async refresh(params: {
    refreshToken: string;
    deviceId?: string;
  }): Promise<AuthSession> {
    const sessions = await this.sessionsRepo.find({
      where: { revokedAt: IsNull() },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const match = await this.findSessionByRefreshToken(
      sessions,
      params.refreshToken,
    );
    if (!match) throw new UnauthorizedException('Session expirée');

    await this.sessionsRepo.update({ id: match.id }, { revokedAt: new Date() });

    const user: AuthUser = { id: match.user.id, email: match.user.email };
    return await this.issueSession({ user, deviceId: params.deviceId });
  }

  async logout(params: { refreshToken: string }): Promise<void> {
    const sessions = await this.sessionsRepo.find({
      where: { revokedAt: IsNull() },
      select: ['id', 'refreshTokenHash'],
      order: { createdAt: 'DESC' },
    });
    const match = await this.findSessionByRefreshToken(
      sessions,
      params.refreshToken,
    );
    if (!match) return;
    await this.sessionsRepo.update({ id: match.id }, { revokedAt: new Date() });
  }

  async me(userId: string): Promise<AuthUser> {
    const u = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email'],
    });
    if (!u) throw new UnauthorizedException();
    return { id: u.id, email: u.email };
  }

  private async findSessionByRefreshToken<
    T extends { id: string; refreshTokenHash: string },
  >(sessions: T[], refreshToken: string): Promise<T | null> {
    // On ne peut pas indexer un hash argon2; on compare sur un nombre réduit de sessions.
    // MVP: OK. Plus tard: refresh token "selector" + hash pour lookup O(1).
    for (const s of sessions as any[]) {
      try {
        const ok = await argon2.verify(s.refreshTokenHash, refreshToken);
        if (ok) return s;
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
      where: { email },
      select: ['id'],
    });
    return { exists: Boolean(existing) };
  }
}
