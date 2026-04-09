import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';

type AuthUser = { id: string; email: string | null };
type AuthSession = { accessToken: string; refreshToken: string; user: AuthUser };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async signAccessToken(user: AuthUser): Promise<string> {
    const secret = this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret, expiresIn: expiresIn as any } as any,
    );
  }

  private async issueSession(params: {
    user: AuthUser;
    deviceId?: string;
  }): Promise<AuthSession> {
    const refreshToken = randomUUID();
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.session.create({
      data: {
        userId: params.user.id,
        refreshTokenHash,
        deviceId: params.deviceId,
      },
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
  }): Promise<AuthSession> {
    const email = params.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Cet email est déjà utilisé');

    const passwordHash = await argon2.hash(params.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        profile: {
          create: { weightKg: 75, heightCm: 175, gender: 'male' },
        },
      },
      select: { id: true, email: true },
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
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });
    if (!user || !user.password) throw new UnauthorizedException('Identifiants invalides');
    const ok = await argon2.verify(user.password, params.password);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');

    return await this.issueSession({
      user: { id: user.id, email: user.email },
      deviceId: params.deviceId,
    });
  }

  async refresh(params: { refreshToken: string; deviceId?: string }): Promise<AuthSession> {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const match = (await this.findSessionByRefreshToken(
      sessions,
      params.refreshToken,
    )) as (typeof sessions)[number] | null;
    if (!match) throw new UnauthorizedException('Session expirée');

    await this.prisma.session.update({
      where: { id: match.id },
      data: { revokedAt: new Date() },
    });

    const user: AuthUser = { id: match.user.id, email: match.user.email };
    return await this.issueSession({ user, deviceId: params.deviceId });
  }

  async logout(params: { refreshToken: string }): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null },
      select: { id: true, refreshTokenHash: true },
      orderBy: { createdAt: 'desc' },
    });
    const match = await this.findSessionByRefreshToken(sessions, params.refreshToken);
    if (!match) return;
    await this.prisma.session.update({
      where: { id: match.id },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
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
}

