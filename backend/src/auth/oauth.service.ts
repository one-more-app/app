import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeJwt, importPKCS8, SignJWT } from 'jose';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

type Provider = 'google' | 'apple';

type IdTokenClaims = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

async function postForm(url: string, data: Record<string, string>) {
  const body = new URLSearchParams(data);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new BadRequestException(json?.error_description ?? json?.error ?? 'OAuth échoué');
  }
  return json;
}

@Injectable()
export class OAuthService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private auth: AuthService,
  ) {}

  start(provider: Provider, params: { redirectUri: string; codeChallenge: string; state?: string }) {
    const state = params.state ?? crypto.randomUUID();
    if (provider === 'google') {
      const clientId = this.mustGet('GOOGLE_CLIENT_ID');
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', params.redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email');
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('state', state);
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      return { authorizationUrl: url.toString(), state };
    }

    if (provider === 'apple') {
      const clientId = this.mustGet('APPLE_CLIENT_ID');
      const url = new URL('https://appleid.apple.com/auth/authorize');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', params.redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('response_mode', 'query');
      url.searchParams.set('scope', 'name email');
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('state', state);
      return { authorizationUrl: url.toString(), state };
    }

    throw new BadRequestException('Provider inconnu');
  }

  async callback(
    provider: Provider,
    params: { code: string; redirectUri: string; codeVerifier: string; deviceId?: string },
  ) {
    const { idToken, providerUserId, email } = await this.exchangeCode(provider, params);

    const linked = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } } as any,
      include: { user: { select: { id: true, email: true } } },
    });

    let userId: string;
    let userEmail: string | null;

    if (linked) {
      userId = linked.user.id;
      userEmail = linked.user.email;
    } else {
      const normalizedEmail = email ? email.trim().toLowerCase() : null;
      const existingByEmail = normalizedEmail
        ? await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, email: true },
          })
        : null;

      if (existingByEmail) {
        userId = existingByEmail.id;
        userEmail = existingByEmail.email;
      } else {
        const created = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            profile: { create: { weightKg: 75, heightCm: 175, gender: 'male' } },
          },
          select: { id: true, email: true },
        });
        userId = created.id;
        userEmail = created.email;
      }

      await this.prisma.oAuthAccount.create({
        data: {
          userId,
          provider,
          providerUserId,
          email: email ? email.trim().toLowerCase() : null,
        },
      });
    }

    return await this.auth.createSessionForUser({
      userId,
      email: userEmail,
      deviceId: params.deviceId,
    });
  }

  private async exchangeCode(
    provider: Provider,
    params: { code: string; redirectUri: string; codeVerifier: string },
  ): Promise<{ idToken: string; providerUserId: string; email: string | null }> {
    if (provider === 'google') {
      const clientId = this.mustGet('GOOGLE_CLIENT_ID');
      const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
      const token = await postForm('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
        code: params.code,
        code_verifier: params.codeVerifier,
        redirect_uri: params.redirectUri,
        grant_type: 'authorization_code',
      });
      const idToken = String(token.id_token ?? '');
      if (!idToken) throw new BadRequestException('id_token manquant');
      const claims = decodeJwt(idToken) as IdTokenClaims;
      const sub = claims.sub;
      if (!sub) throw new BadRequestException('sub manquant');
      const email = claims.email ? String(claims.email) : null;
      return { idToken, providerUserId: sub, email };
    }

    if (provider === 'apple') {
      const clientId = this.mustGet('APPLE_CLIENT_ID');
      const clientSecret = await this.makeAppleClientSecret();
      const token = await postForm('https://appleid.apple.com/auth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: params.code,
        code_verifier: params.codeVerifier,
        redirect_uri: params.redirectUri,
        grant_type: 'authorization_code',
      });
      const idToken = String(token.id_token ?? '');
      if (!idToken) throw new BadRequestException('id_token manquant');
      const claims = decodeJwt(idToken) as IdTokenClaims;
      const sub = claims.sub;
      if (!sub) throw new BadRequestException('sub manquant');
      const email = claims.email ? String(claims.email) : null;
      return { idToken, providerUserId: sub, email };
    }

    throw new BadRequestException('Provider inconnu');
  }

  private mustGet(key: string): string {
    const v = this.config.get<string>(key);
    if (!v) throw new BadRequestException(`Variable manquante: ${key}`);
    return v;
  }

  private async makeAppleClientSecret(): Promise<string> {
    const teamId = this.mustGet('APPLE_TEAM_ID');
    const keyId = this.mustGet('APPLE_KEY_ID');
    const clientId = this.mustGet('APPLE_CLIENT_ID');
    const privateKey = this.mustGet('APPLE_PRIVATE_KEY');

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 10; // 10 min

    const key = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'ES256');
    return await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .setAudience('https://appleid.apple.com')
      .setIssuer(teamId)
      .setSubject(clientId)
      .sign(key);
  }
}

