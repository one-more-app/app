import { randomBytes } from 'crypto';

const INVITE_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const INVITE_CODE_LENGTH = 8;

export function generateInviteCode(): string {
  const bytes = randomBytes(INVITE_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS[bytes[i] % INVITE_CODE_CHARS.length];
  }
  return code.toLowerCase();
}

/** URL OneLink AppsFlyer (deferred + direct deep link). */
export function buildAppsFlyerInviteUrl(code: string): string | null {
  const domain = process.env.APPSFLYER_ONELINK_DOMAIN?.replace(
    /^https?:\/\//,
    '',
  ).replace(/\/+$/, '');
  const templateId = process.env.APPSFLYER_ONELINK_ID?.replace(/^\//, '');
  if (!domain || !templateId) return null;

  const normalized = code.trim().toLowerCase();
  const params = new URLSearchParams({
    deep_link_value: normalized,
    pid: 'friend_invite',
  });
  return `https://${domain}/${templateId}?${params.toString()}`;
}

/** OneLink uniquement. Retourne `null` si `APPSFLYER_ONELINK_*` absents. */
export function buildInviteUrl(code: string): string | null {
  return buildAppsFlyerInviteUrl(code);
}
