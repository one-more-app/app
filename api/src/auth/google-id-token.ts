import { BadRequestException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

type GoogleIdTokenClaims = {
  sub?: string;
  email?: string;
};

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<{ sub: string; email: string | null }> {
  let payload: GoogleIdTokenClaims;
  try {
    const verified = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    payload = verified.payload;
  } catch {
    throw new BadRequestException('id_token Google invalide');
  }

  const sub = payload.sub;
  if (!sub) throw new BadRequestException('sub manquant');
  const email = payload.email ? String(payload.email) : null;
  return { sub, email };
}
