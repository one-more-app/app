import type { AuthSession, AuthUser, StoredAuthSession } from "@/lib/auth";
import {
  clearStoredSession,
  loginWithEmail,
  logoutSession,
  readStoredSession,
  refreshSession,
  registerWithEmail,
  writeStoredSession,
} from "@/lib/auth";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { syncAppsFlyerCustomerUserId } from "@/lib/appsflyer";
import { consumePendingInviteCode } from "@/lib/invite-code";
import { ApiError } from "@/lib/api";
import { ACCESS_SWR_KEY } from "@/lib/social-api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";

type AuthState = {
  status: "anonymous" | "authenticated";
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextValue = AuthState & {
  register: (params: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  acceptSession: (session: AuthSession) => void;
  lastError: string | null;
  clearError: () => void;
  setError: (message: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToState(session: StoredAuthSession): AuthState {
  return {
    status: "authenticated",
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<AuthState>(() => {
    const stored = readStoredSession();
    return stored ? sessionToState(stored) : { status: "anonymous", user: null, accessToken: null, refreshToken: null };
  });
  const [lastError, setLastError] = useState<string | null>(null);

  const applySession = useCallback((session: AuthSession) => {
    const stored: StoredAuthSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    };
    writeStoredSession(stored);
    setState(sessionToState(stored));
    void syncAppsFlyerCustomerUserId(session.user.id);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setState({ status: "anonymous", user: null, accessToken: null, refreshToken: null });
    void syncAppsFlyerCustomerUserId(null);
  }, []);

  const clearError = useCallback(() => setLastError(null), []);
  const setError = useCallback((message: string) => setLastError(message), []);

  const normalizeError = (e: unknown): string => {
    if (e instanceof ApiError) return e.message;
    if (e instanceof Error) return e.message;
    return "Une erreur est survenue";
  };

  const register = useCallback(
    async ({
      email,
      password,
      username,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      username: string;
      firstName?: string;
      lastName?: string;
    }) => {
      clearError();
      try {
        const inviteCode = consumePendingInviteCode() ?? undefined;
        const session = await registerWithEmail({
          email,
          password,
          username,
          inviteCode,
          firstName: firstName?.trim() || undefined,
          lastName: lastName?.trim() || undefined,
        });
        applySession(session);
        track(AnalyticsEvents.USER_REGISTERED, { method: "email" });
      } catch (e) {
        setLastError(normalizeError(e));
        throw e;
      }
    },
    [applySession, clearError],
  );

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    clearError();
    try {
      const session = await loginWithEmail({ email, password });
      applySession(session);
      track(AnalyticsEvents.USER_LOGGED_IN, { method: "email" });
    } catch (e) {
      setLastError(normalizeError(e));
      throw e;
    }
  }, [applySession, clearError]);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!state.refreshToken) return false;
    try {
      const session = await refreshSession({ refreshToken: state.refreshToken });
      applySession(session);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [applySession, clearSession, state.refreshToken]);

  const logout = useCallback(async () => {
    clearError();
    try {
      if (state.refreshToken) {
        await logoutSession({ refreshToken: state.refreshToken });
      }
    } catch {
      // si le backend est indisponible, on supprime quand même localement
    } finally {
      clearSession();
    }
  }, [clearError, clearSession, state.refreshToken]);

  useEffect(() => {
    // refresh "best effort" au démarrage si on a une session.
    if (state.status !== "authenticated") return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status !== "authenticated") return;
    void Promise.all([
      mutate("tracked-exercises"),
      mutate("performance-entries"),
      mutate("profile"),
      mutate("home-exercises"),
      mutate(ACCESS_SWR_KEY),
    ]).catch((e) => setLastError(normalizeError(e)));
  }, [state.status, state.accessToken]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,
      register,
      login,
      logout,
      refresh,
      acceptSession: applySession,
      lastError,
      clearError,
      setError,
    };
  }, [state, register, login, logout, refresh, lastError, clearError, setError, applySession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  }
  return ctx;
}

