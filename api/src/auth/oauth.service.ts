import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { decodeJwt, importPKCS8, SignJWT } from 'jose';
import { Repository } from 'typeorm';
import { verifyAppleIdToken } from './apple-id-token.js';
import { verifyGoogleIdToken } from './google-id-token.js';
import {
  listAllowedRedirectUris,
  resolveGoogleRedirectUri,
} from './google-oauth-config.js';
import {
  OAuthAccountEntity,
  OAuthProvider,
} from './entities/oauth-account.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { AuthService } from './auth.service.js';
import { InvitesService } from '../social/invites.service.js';
import { ReferralService } from '../social/referral.service.js';
import { consumeOAuthState, saveOAuthState } from './oauth-state.store.js';

type Provider = 'google' | 'apple';
type Platform = 'android' | 'ios';

type IdTokenClaims = {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

type OAuthTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

async function postForm(
  url: string,
  data: Record<string, string>,
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams(data);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let json: OAuthTokenResponse | null = null;
  try {
    json = JSON.parse(text) as OAuthTokenResponse;
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new BadRequestException(
      json?.error_description ?? json?.error ?? 'OAuth échoué',
    );
  }
  return json ?? {};
}

function toOAuthProvider(provider: Provider): OAuthProvider {
  return provider === 'google' ? OAuthProvider.GOOGLE : OAuthProvider.APPLE;
}

@Injectable()
export class OAuthService {
  constructor(
    private config: ConfigService,
    @InjectRepository(OAuthAccountEntity)
    private readonly oauthAccountsRepo: Repository<OAuthAccountEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    private auth: AuthService,
    private invites: InvitesService,
    private referrals: ReferralService,
  ) {}

  start(
    provider: Provider,
    params: {
      redirectUri?: string;
      codeChallenge: string;
      platform: Platform;
      state?: string;
    },
  ) {
    const state = params.state ?? crypto.randomUUID();

    if (provider === 'google') {
      const clientId = this.googleClientId(params.platform);
      const redirectUri = resolveGoogleRedirectUri(
        this.config,
        clientId,
        params.platform,
      );
      this.assertAllowedRedirectUri(redirectUri);

      saveOAuthState(state, {
        redirectUri,
        platform: params.platform,
        provider,
      });

      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email');
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('state', state);
      return { authorizationUrl: url.toString(), state, redirectUri };
    }

    if (provider === 'apple') {
      const redirectUri = params.redirectUri?.trim();
      if (!redirectUri) {
        throw new BadRequestException('redirectUri requis pour Apple Sign-In');
      }
      this.assertAllowedRedirectUri(redirectUri);

      saveOAuthState(state, {
        redirectUri,
        platform: params.platform,
        provider,
      });

      const clientId = this.mustGet('APPLE_CLIENT_ID');
      const url = new URL('https://appleid.apple.com/auth/authorize');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
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
    params: {
      code: string;
      redirectUri: string;
      codeVerifier: string;
      state: string;
      deviceId?: string;
      inviteCode?: string;
      weightKg?: number;
      heightCm?: number;
      gender?: 'male' | 'female';
    },
  ) {
    const pending = consumeOAuthState(params.state);
    if (pending.provider !== provider) {
      throw new BadRequestException('state OAuth incohérent');
    }
    if (pending.redirectUri !== params.redirectUri) {
      throw new BadRequestException('redirectUri incohérent');
    }
    this.assertAllowedRedirectUri(params.redirectUri);

    const { providerUserId, email } = await this.exchangeCode(provider, {
      code: params.code,
      redirectUri: params.redirectUri,
      codeVerifier: params.codeVerifier,
      platform: pending.platform,
    });

    return await this.linkOAuthUser({
      provider,
      providerUserId,
      email,
      deviceId: params.deviceId,
      inviteCode: params.inviteCode,
      weightKg: params.weightKg,
      heightCm: params.heightCm,
      gender: params.gender,
    });
  }

  async signInWithGoogleIdToken(params: {
    idToken: string;
    platform: Platform;
    deviceId?: string;
    inviteCode?: string;
    firstName?: string;
    lastName?: string;
    weightKg?: number;
    heightCm?: number;
    gender?: 'male' | 'female';
  }) {
    const audience = this.googleIdTokenAudience(params.platform);
    const {
      sub,
      email,
      firstName: tokenFirstName,
      lastName: tokenLastName,
    } = await verifyGoogleIdToken(params.idToken, audience);
    return await this.linkOAuthUser({
      provider: 'google',
      providerUserId: sub,
      email,
      deviceId: params.deviceId,
      inviteCode: params.inviteCode,
      firstName: tokenFirstName ?? this.normalizeName(params.firstName),
      lastName: tokenLastName ?? this.normalizeName(params.lastName),
      weightKg: params.weightKg,
      heightCm: params.heightCm,
      gender: params.gender,
    });
  }

  async signInWithAppleIdToken(params: {
    idToken: string;
    platform: Platform;
    deviceId?: string;
    inviteCode?: string;
    firstName?: string;
    lastName?: string;
    weightKg?: number;
    heightCm?: number;
    gender?: 'male' | 'female';
  }) {
    const audience = this.appleIdTokenAudience(params.platform);
    const {
      sub,
      email,
      firstName: tokenFirstName,
      lastName: tokenLastName,
    } = await verifyAppleIdToken(params.idToken, audience);
    return await this.linkOAuthUser({
      provider: 'apple',
      providerUserId: sub,
      email,
      deviceId: params.deviceId,
      inviteCode: params.inviteCode,
      firstName: tokenFirstName ?? this.normalizeName(params.firstName),
      lastName: tokenLastName ?? this.normalizeName(params.lastName),
      weightKg: params.weightKg,
      heightCm: params.heightCm,
      gender: params.gender,
    });
  }

  private async linkOAuthUser(params: {
    provider: Provider;
    providerUserId: string;
    email: string | null;
    deviceId?: string;
    inviteCode?: string;
    firstName?: string | null;
    lastName?: string | null;
    weightKg?: number;
    heightCm?: number;
    gender?: 'male' | 'female';
  }) {
    const oauthProvider = toOAuthProvider(params.provider);
    const linked = await this.oauthAccountsRepo.findOne({
      where: { provider: oauthProvider, providerUserId: params.providerUserId },
      relations: { user: true },
    });

    let userId: string;
    let userEmail: string | null;

    if (linked) {
      userId = linked.user.id;
      userEmail = linked.user.email;
    } else {
      const normalizedEmail = params.email
        ? params.email.trim().toLowerCase()
        : null;
      const existingByEmail = normalizedEmail
        ? await this.usersRepo.findOne({
            where: { email: normalizedEmail },
            select: ['id', 'email'],
          })
        : null;

      const normalizedFirstName = this.normalizeName(params.firstName);
      const normalizedLastName = this.normalizeName(params.lastName);

      if (existingByEmail) {
        userId = existingByEmail.id;
        userEmail = existingByEmail.email;
      } else {
        const created = await this.usersRepo.save({
          email: normalizedEmail,
          password: null,
        });
        await this.invites.createDefaultProfile(created.id, {
          email: normalizedEmail,
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          weightKg: params.weightKg,
          heightCm: params.heightCm,
          gender: params.gender,
        });
        await this.referrals.applyReferralCodeOnSignup({
          newUserId: created.id,
          inviteCode: params.inviteCode,
        });
        userId = created.id;
        userEmail = created.email;
      }

      if (existingByEmail && (normalizedFirstName || normalizedLastName)) {
        await this.backfillProfileNamesIfMissing({
          userId,
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
        });
      }

      await this.oauthAccountsRepo.save({
        userId,
        provider: oauthProvider,
        providerUserId: params.providerUserId,
        email: params.email ? params.email.trim().toLowerCase() : null,
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
    params: {
      code: string;
      redirectUri: string;
      codeVerifier: string;
      platform: Platform;
    },
  ): Promise<{ providerUserId: string; email: string | null }> {
    if (provider === 'google') {
      const clientId = this.googleClientId(params.platform);
      const clientSecret =
        this.config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
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
      const { sub, email } = await verifyGoogleIdToken(idToken, clientId);
      return { providerUserId: sub, email };
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
      return { providerUserId: sub, email };
    }

    throw new BadRequestException('Provider inconnu');
  }

  private googleClientId(platform: Platform): string {
    const key =
      platform === 'ios' ? 'GOOGLE_CLIENT_ID_IOS' : 'GOOGLE_CLIENT_ID_ANDROID';
    const platformClientId = this.config.get<string>(key)?.trim();
    if (platformClientId) return platformClientId;

    const legacyClientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    if (legacyClientId) return legacyClientId;

    throw new BadRequestException(`Variable manquante: ${key}`);
  }

  /** Audience JWT pour Google Sign-In natif (Capgo SDK). */
  private googleIdTokenAudience(platform: Platform): string {
    if (platform === 'ios') {
      return this.googleClientId('ios');
    }

    const webClientId = this.config.get<string>('GOOGLE_CLIENT_ID_WEB')?.trim();
    if (webClientId) return webClientId;

    throw new BadRequestException('Variable manquante: GOOGLE_CLIENT_ID_WEB');
  }

  /** Audience JWT pour Sign in with Apple natif (Bundle ID iOS). */
  private appleIdTokenAudience(platform: Platform): string {
    if (platform === 'ios') {
      const iosBundle = this.config.get<string>('APPLE_CLIENT_ID_IOS')?.trim();
      if (iosBundle) return iosBundle;
      throw new BadRequestException('Variable manquante: APPLE_CLIENT_ID_IOS');
    }

    const androidClientId = this.config
      .get<string>('APPLE_CLIENT_ID_ANDROID')
      ?.trim();
    if (androidClientId) return androidClientId;

    return this.mustGet('APPLE_CLIENT_ID');
  }

  private assertAllowedRedirectUri(redirectUri: string): void {
    const normalized = redirectUri.replace(/\/+$/, '');
    const allowed = this.allowedRedirectUris();
    if (!allowed.includes(normalized)) {
      throw new BadRequestException('redirectUri non autorisé');
    }
  }

  private allowedRedirectUris(): string[] {
    return listAllowedRedirectUris(this.config);
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
    const exp = now + 60 * 10;

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

  private normalizeName(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async backfillProfileNamesIfMissing(params: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
  }): Promise<void> {
    const profile = await this.profilesRepo.findOne({
      where: { userId: params.userId },
      select: ['id', 'firstName', 'lastName'],
    });
    if (!profile) return;

    const nextFirstName = profile.firstName ?? params.firstName;
    const nextLastName = profile.lastName ?? params.lastName;
    if (
      nextFirstName === profile.firstName &&
      nextLastName === profile.lastName
    ) {
      return;
    }

    await this.profilesRepo.update(
      { id: profile.id },
      {
        firstName: nextFirstName,
        lastName: nextLastName,
      },
    );
  }
}
