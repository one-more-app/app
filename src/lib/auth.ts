import { apiFetch } from "@/lib/api";

const AUTH_STORAGE_KEY = "one-more-auth-v1";

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
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
      typeof parsed.user !== "object" ||
      typeof (parsed.user as any).id !== "string"
    ) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: {
        id: String((parsed.user as any).id),
        email:
          (parsed.user as any).email === null ||
          typeof (parsed.user as any).email === "string"
            ? ((parsed.user as any).email as string | null)
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

export async function registerWithEmail(params: {
  email: string;
  password: string;
  deviceId?: string;
}): Promise<AuthSession> {
  return await apiFetch<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function loginWithEmail(params: {
  email: string;
  password: string;
  deviceId?: string;
}): Promise<AuthSession> {
  return await apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function refreshSession(params: {
  refreshToken: string;
  deviceId?: string;
}): Promise<AuthSession> {
  return await apiFetch<AuthSession>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function logoutSession(params: {
  refreshToken: string;
  deviceId?: string;
}): Promise<void> {
  await apiFetch<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

