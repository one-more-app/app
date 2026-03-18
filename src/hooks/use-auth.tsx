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
import { ApiError } from "@/lib/api";
import { syncNow } from "@/lib/sync";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type AuthState = {
  status: "anonymous" | "authenticated";
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextValue = AuthState & {
  register: (params: { email: string; password: string }) => Promise<void>;
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
  const [state, setState] = useState<AuthState>(() => {
    const stored = readStoredSession();
    return stored ? sessionToState(stored) : { status: "anonymous", user: null, accessToken: null, refreshToken: null };
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const lastSyncedAccessTokenRef = useRef<string | null>(null);
  const latestSyncSessionRef = useRef<AuthSession | null>(null);
  const syncInFlightRef = useRef(false);
  const pendingSyncRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  const applySession = useCallback((session: AuthSession) => {
    const stored: StoredAuthSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    };
    writeStoredSession(stored);
    setState(sessionToState(stored));
  }, []);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setState({ status: "anonymous", user: null, accessToken: null, refreshToken: null });
  }, []);

  const clearError = useCallback(() => setLastError(null), []);
  const setError = useCallback((message: string) => setLastError(message), []);

  const normalizeError = (e: unknown): string => {
    if (e instanceof ApiError) return e.message;
    if (e instanceof Error) return e.message;
    return "Une erreur est survenue";
  };

  const register = useCallback(async ({ email, password }: { email: string; password: string }) => {
    clearError();
    try {
      const session = await registerWithEmail({ email, password });
      applySession(session);
    } catch (e) {
      setLastError(normalizeError(e));
      throw e;
    }
  }, [applySession, clearError]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    clearError();
    try {
      const session = await loginWithEmail({ email, password });
      applySession(session);
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
    // Auto-sync: une fois qu'on a une session valide (auto-connexion ou login),
    // on push+pull pour récupérer les données manquantes.
    if (state.status !== "authenticated") return;
    if (!state.accessToken || !state.refreshToken || !state.user) return;
    if (lastSyncedAccessTokenRef.current === state.accessToken) return;

    lastSyncedAccessTokenRef.current = state.accessToken;
    latestSyncSessionRef.current = {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    };
    void syncNow({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    }).catch((e) => {
      setLastError(normalizeError(e));
    });
  }, [state.status, state.accessToken, state.refreshToken, state.user]);

  useEffect(() => {
    // Maintient à jour la session courante utilisée par l'auto-sync au fil des actions.
    if (state.status !== "authenticated") {
      latestSyncSessionRef.current = null;
      return;
    }
    if (!state.accessToken || !state.refreshToken || !state.user) return;
    latestSyncSessionRef.current = {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    };
  }, [state.status, state.accessToken, state.refreshToken, state.user]);

  useEffect(() => {
    const runSync = async () => {
      const session = latestSyncSessionRef.current;
      if (!session) return;

      if (syncInFlightRef.current) {
        pendingSyncRef.current = true;
        return;
      }

      syncInFlightRef.current = true;
      try {
        await syncNow(session);
      } catch (e) {
        setLastError(normalizeError(e));
      } finally {
        syncInFlightRef.current = false;
        if (pendingSyncRef.current) {
          pendingSyncRef.current = false;
          void runSync();
        }
      }
    };

    const onLocalDataChanged = () => {
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        void runSync();
      }, 800);
    };

    window.addEventListener("one-more:local-data-changed", onLocalDataChanged);
    return () => {
      window.removeEventListener("one-more:local-data-changed", onLocalDataChanged);
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

