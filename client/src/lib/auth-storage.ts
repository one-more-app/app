const AUTH_STORAGE_KEY = "one-more-auth-v1";

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string | null };
};

type StoredSessionUser = {
  id?: unknown;
  email?: unknown;
};

export function readStoredSession(): StoredAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      !parsed.user ||
      typeof parsed.user !== "object"
    ) {
      return null;
    }
    const user = parsed.user as StoredSessionUser;
    if (typeof user.id !== "string") {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: {
        id: user.id,
        email:
          typeof user.email === "string" || user.email === null
            ? user.email
            : null,
      },
    };
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredAuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
