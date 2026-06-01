const PENDING_INVITE_KEY = "one-more-pending-invite-v1";

export function setPendingInviteCode(code: string): void {
  try {
    localStorage.setItem(PENDING_INVITE_KEY, code.trim().toLowerCase());
  } catch {
    // ignore
  }
}

export function peekPendingInviteCode(): string | null {
  try {
    return localStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

export function consumePendingInviteCode(): string | null {
  const code = peekPendingInviteCode();
  if (!code) return null;
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // ignore
  }
  return code;
}

export function clearPendingInviteCode(): void {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // ignore
  }
}
