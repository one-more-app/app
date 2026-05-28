import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

/** Format Google recommandé pour les clients natifs Android/iOS. */
export function googleReverseRedirectUri(clientId: string): string {
  if (!clientId.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    throw new BadRequestException('Client ID Google invalide');
  }
  const prefix = clientId.slice(0, -GOOGLE_CLIENT_ID_SUFFIX.length);
  return `com.googleusercontent.apps.${prefix}:/oauth2redirect`;
}

function normalizeRedirectUri(uri: string): string {
  return uri.trim().replace(/\/+$/, '');
}

type OAuthPlatform = 'android' | 'ios';

/**
 * Résout le redirect_uri Google pour le flux Capacitor Browser + PKCE.
 * - GOOGLE_REDIRECT_URI=reverse → scheme Google inversé (client natif)
 * - GOOGLE_REDIRECT_URI=https://... ou com.onemore.app:/oauth → valeur explicite
 * - iOS (défaut) → scheme Google inversé (obligatoire pour client OAuth iOS)
 * - Android (défaut) → OAUTH_REDIRECT_URIS ou com.onemore.app:/oauth
 */
export function resolveGoogleRedirectUri(
  config: ConfigService,
  clientId: string,
  platform: OAuthPlatform,
): string {
  const explicit = config.get<string>('GOOGLE_REDIRECT_URI')?.trim();
  if (explicit === 'reverse') {
    return googleReverseRedirectUri(clientId);
  }
  if (explicit) {
    return normalizeRedirectUri(explicit);
  }

  if (platform === 'ios') {
    return googleReverseRedirectUri(clientId);
  }

  const fromList = config.get<string>('OAUTH_REDIRECT_URIS')?.split(',')[0]?.trim();
  if (fromList) {
    return normalizeRedirectUri(fromList);
  }

  return 'com.onemore.app:/oauth';
}

function appendReverseRedirectUris(config: ConfigService, allowed: string[]): void {
  for (const key of ['GOOGLE_CLIENT_ID_IOS', 'GOOGLE_CLIENT_ID_ANDROID'] as const) {
    const clientId = config.get<string>(key)?.trim();
    if (!clientId) continue;
    try {
      allowed.push(normalizeRedirectUri(googleReverseRedirectUri(clientId)));
    } catch {
      // ignore invalid client id
    }
  }
}

export function listAllowedRedirectUris(config: ConfigService): string[] {
  const raw = config.get<string>('OAUTH_REDIRECT_URIS')?.trim();
  const defaults = ['com.onemore.app:/oauth', 'com.onemore.app://oauth'];
  const fromEnv = raw
    ? raw.split(',').map((s) => normalizeRedirectUri(s)).filter(Boolean)
    : [];
  const allowed = [...new Set([...fromEnv, ...defaults])];
  appendReverseRedirectUris(config, allowed);
  return [...new Set(allowed)];
}
