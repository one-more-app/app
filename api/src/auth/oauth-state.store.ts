import { BadRequestException } from '@nestjs/common';

const STATE_TTL_MS = 10 * 60 * 1000;

type PendingOAuthState = {
  redirectUri: string;
  platform: 'android' | 'ios';
  provider: 'google' | 'apple';
  expiresAt: number;
};

const pendingStates = new Map<string, PendingOAuthState>();

export function saveOAuthState(
  state: string,
  params: Omit<PendingOAuthState, 'expiresAt'>,
): void {
  pendingStates.set(state, {
    ...params,
    expiresAt: Date.now() + STATE_TTL_MS,
  });
}

export function consumeOAuthState(state: string): PendingOAuthState {
  const entry = pendingStates.get(state);
  pendingStates.delete(state);
  if (!entry) {
    throw new BadRequestException('state OAuth invalide ou expiré');
  }
  if (Date.now() > entry.expiresAt) {
    throw new BadRequestException('state OAuth expiré');
  }
  return entry;
}
