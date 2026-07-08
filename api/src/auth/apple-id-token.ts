import { BadRequestException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

type AppleIdTokenClaims = {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export async function verifyAppleIdToken(
  idToken: string,
  audience: string,
): Promise<{
  sub: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}> {
  let payload: AppleIdTokenClaims;
  try {
    const verified = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience,
    });
    payload = verified.payload;
  } catch {
    throw new BadRequestException('id_token Apple invalide');
  }

  const sub = payload.sub;
  if (!sub) throw new BadRequestException('sub manquant');
  const email = payload.email ? String(payload.email) : null;

  const firstName = payload.given_name ? String(payload.given_name).trim() : '';
  const lastName = payload.family_name ? String(payload.family_name).trim() : '';
  if (firstName || lastName) {
    return {
      sub,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
    };
  }

  const fullName = payload.name ? String(payload.name).trim() : '';
  if (!fullName) {
    return { sub, email, firstName: null, lastName: null };
  }
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { sub, email, firstName: parts[0] ?? null, lastName: null };
  }

  return {
    sub,
    email,
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(' ') || null,
  };
}
