import { BadRequestException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

type AppleIdTokenClaims = {
  sub?: string;
  email?: string;
};

export async function verifyAppleIdToken(
  idToken: string,
  audience: string,
): Promise<{ sub: string; email: string | null }> {
  let payload: AppleIdTokenClaims;
  try {
    const verified = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience,
    });
    payload = verified.payload as AppleIdTokenClaims;
  } catch {
    throw new BadRequestException('id_token Apple invalide');
  }

  const sub = payload.sub;
  if (!sub) throw new BadRequestException('sub manquant');
  const email = payload.email ? String(payload.email) : null;
  return { sub, email };
}
