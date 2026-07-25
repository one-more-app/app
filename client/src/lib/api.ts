import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
  type StoredAuthSession,
} from "@/lib/auth-storage";

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

declare global {
  interface Window {
    __ONE_MORE_API_URL__?: string;
  }
}

export function getApiBaseUrl(): string {
  const runtime =
    typeof window !== "undefined" && typeof window.__ONE_MORE_API_URL__ === "string"
      ? window.__ONE_MORE_API_URL__
      : "";
  if (runtime.trim()) {
    return runtime.trim().replace(/\/+$/, "");
  }
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === "string" && raw.trim()) return raw.trim().replace(/\/+$/, "");
  return "http://localhost:3000";
}

type ApiUnreachableListener = () => void;

let onApiUnreachable: ApiUnreachableListener | null = null;

export function setOnApiUnreachable(listener: ApiUnreachableListener | null): void {
  onApiUnreachable = listener;
}

function notifyApiUnreachable(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  onApiUnreachable?.();
}

export type AuthSessionListener = {
  onRefreshed: (session: StoredAuthSession) => void;
  onCleared: () => void;
};

let authSessionListener: AuthSessionListener | null = null;

/** Sync React auth state when the shared refresh path writes/clears storage. */
export function setAuthSessionListener(listener: AuthSessionListener | null): void {
  authSessionListener = listener;
}

let refreshInFlight: Promise<StoredAuthSession> | null = null;

/**
 * Single-flight refresh: mount + 401 interceptor share the same promise so a
 * rotated refresh token is never reused concurrently.
 */
export async function refreshAccessToken(): Promise<StoredAuthSession> {
  if (refreshInFlight) return refreshInFlight;

  const pending = (async () => {
    const stored = readStoredSession();
    if (!stored) throw new ApiError("Session absente", 401, null);

    const baseUrl = getApiBaseUrl();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
    } catch (error) {
      notifyApiUnreachable();
      const reason = error instanceof Error ? error.message : String(error);
      throw new ApiError(
        `Impossible de joindre l'API (${baseUrl}). Vérifie le déploiement backend et la route /auth/refresh. ${reason}`,
        0,
        null,
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      // On purge localement uniquement si le refresh token est réellement rejeté.
      if (res.status === 401 || res.status === 403) {
        clearStoredSession();
        authSessionListener?.onCleared();
      }
      const msg =
        payload && typeof payload === "object" && (payload.message || payload.error)
          ? String(
              (payload as { message?: unknown; error?: unknown }).message ||
                (payload as { message?: unknown; error?: unknown }).error,
            )
          : `Refresh échoué (${res.status})`;
      throw new ApiError(msg, res.status, payload);
    }

    const session = payload as StoredAuthSession;
    if (
      !session ||
      typeof session.accessToken !== "string" ||
      typeof session.refreshToken !== "string" ||
      !session.user ||
      typeof session.user.id !== "string"
    ) {
      throw new ApiError("Réponse refresh invalide", 500, payload);
    }

    const next: StoredAuthSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: session.user.id,
        email:
          typeof session.user.email === "string" || session.user.email === null
            ? session.user.email
            : null,
      },
    };

    writeStoredSession(next);
    authSessionListener?.onRefreshed(next);
    return next;
  })();

  refreshInFlight = pending;
  try {
    return await pending;
  } finally {
    if (refreshInFlight === pending) {
      refreshInFlight = null;
    }
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { authToken?: string; skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const { authToken, headers, skipAuthRefresh, ...rest } = init;
  const stored = readStoredSession();
  const tokenToUse = authToken ?? stored?.accessToken ?? null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        "content-type": "application/json",
        ...(tokenToUse ? { authorization: `Bearer ${tokenToUse}` } : {}),
        ...(headers ?? {}),
      },
    });
  } catch (error) {
    notifyApiUnreachable();
    const reason = error instanceof Error ? error.message : String(error);
    throw new ApiError(
      `Impossible de joindre l'API (${baseUrl}). Vérifie le déploiement backend et la route ${path}. ${reason}`,
      0,
      null,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await res.json().catch(() => null)) as unknown) : await res.text();

  if (!res.ok) {
    const isAuthPath = typeof path === "string" && path.startsWith("/auth/");
    if (res.status === 401 && !skipAuthRefresh && !isAuthPath && tokenToUse) {
      // Si l'`accessToken` expire, on tente un refresh puis on retente une fois.
      const refreshed = await refreshAccessToken();
      const retryRes = await fetch(url, {
        ...rest,
        headers: {
          "content-type": "application/json",
          ...(refreshed.accessToken ? { authorization: `Bearer ${refreshed.accessToken}` } : {}),
          ...(headers ?? {}),
        },
      });
      const retryContentType = retryRes.headers.get("content-type") ?? "";
      const retryIsJson = retryContentType.includes("application/json");
      const retryPayload = retryIsJson
        ? await retryRes.json().catch(() => null)
        : await retryRes.text();
      if (!retryRes.ok) {
        throw new ApiError(
          `Requête API échouée (${retryRes.status})`,
          retryRes.status,
          retryPayload,
        );
      }
      return retryPayload as T;
    }

    const p = payload as ApiErrorPayload | null;
    const msg =
      (p && typeof p === "object" && (p.message || p.error)) ||
      (res.status === 404 &&
      (path.includes("/oauth/google/id-token") ||
        path.includes("/oauth/apple/id-token"))
        ? `Route ${path} absente sur l'API déployée. Redéploie le service api/ avec les routes id-token.`
        : `Requête API échouée (${res.status})`);
    throw new ApiError(String(msg), res.status, payload);
  }
  return payload as T;
}

export async function apiFetchFormData<T>(
  path: string,
  formData: FormData,
  init: RequestInit & { authToken?: string; skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const { authToken, headers, skipAuthRefresh, ...rest } = init;
  const stored = readStoredSession();
  const tokenToUse = authToken ?? stored?.accessToken ?? null;

  const buildHeaders = (token: string | null): HeadersInit => ({
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(headers ?? {}),
  });

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      method: rest.method ?? "POST",
      body: formData,
      headers: buildHeaders(tokenToUse),
    });
  } catch (error) {
    notifyApiUnreachable();
    const reason = error instanceof Error ? error.message : String(error);
    throw new ApiError(
      `Impossible de joindre l'API (${baseUrl}). Vérifie le déploiement backend et la route ${path}. ${reason}`,
      0,
      null,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await res.json().catch(() => null)) as unknown) : await res.text();

  if (!res.ok) {
    const isAuthPath = typeof path === "string" && path.startsWith("/auth/");
    if (res.status === 401 && !skipAuthRefresh && !isAuthPath && tokenToUse) {
      const refreshed = await refreshAccessToken();
      const retryRes = await fetch(url, {
        ...rest,
        method: rest.method ?? "POST",
        body: formData,
        headers: buildHeaders(refreshed.accessToken),
      });
      const retryContentType = retryRes.headers.get("content-type") ?? "";
      const retryIsJson = retryContentType.includes("application/json");
      const retryPayload = retryIsJson
        ? await retryRes.json().catch(() => null)
        : await retryRes.text();
      if (!retryRes.ok) {
        throw new ApiError(
          `Requête API échouée (${retryRes.status})`,
          retryRes.status,
          retryPayload,
        );
      }
      return retryPayload as T;
    }

    const p = payload as ApiErrorPayload | null;
    const msg =
      (p && typeof p === "object" && (p.message || p.error)) ||
      `Requête API échouée (${res.status})`;
    throw new ApiError(String(msg), res.status, payload);
  }
  return payload as T;
}
