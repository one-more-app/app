import { BadRequestException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

type GoogleIdTokenClaims = {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<{
  sub: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}> {
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
