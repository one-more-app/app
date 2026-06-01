import { randomBytes } from 'crypto';

const INVITE_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const INVITE_CODE_LENGTH = 8;

export function generateInviteCode(): string {
  const bytes = randomBytes(INVITE_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS[bytes[i]! % INVITE_CODE_CHARS.length];
  }
  return code.toLowerCase();
}

export function buildInviteUrl(code: string, baseUrl?: string): string {
  const origin =
    baseUrl?.replace(/\/+$/, '') ??
    process.env.PUBLIC_APP_URL?.replace(/\/+$/, '') ??
    'https://one-more.app';
  return `${origin}/#/invite/${code}`;
}
