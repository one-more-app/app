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

export type UsernameCheckResult = {
  available: boolean;
  username: string;
  reason: "empty" | "invalid" | "taken" | null;
};

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameCheckResult> {
  const params = new URLSearchParams({ username });
  return await apiFetch<UsernameCheckResult>(
    `/auth/username/check?${params.toString()}`,
  );
}

export async function suggestUsername(params: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<{ suggested: string; available: string }> {
  const q = new URLSearchParams();
  if (params.firstName) q.set("firstName", params.firstName);
  if (params.lastName) q.set("lastName", params.lastName);
  if (params.email) q.set("email", params.email);
  return await apiFetch(`/auth/username/suggest?${q.toString()}`);
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  username: string;
  deviceId?: string;
  inviteCode?: string;
  firstName?: string;
  lastName?: string;
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

export async function identifyEmail(params: {
  email: string;
}): Promise<{ exists: boolean }> {
  return await apiFetch<{ exists: boolean }>("/auth/identify", {
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

