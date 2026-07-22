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

const AUTH_STORAGE_KEY = "one-more-auth-v1";

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

type StoredSessionShape = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string | null };
};

type StoredSessionUser = {
  id?: unknown;
  email?: unknown;
};

function readStoredSession(): StoredSessionShape | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSessionShape>;
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

function writeStoredSession(session: StoredSessionShape): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

let refreshInFlight: Promise<unknown> | null = null;

async function refreshAccessToken(baseUrl: string): Promise<StoredSessionShape> {
  const stored = readStoredSession();
  if (!stored) throw new ApiError("Session absente", 401, null);
  if (refreshInFlight) return (await refreshInFlight) as StoredSessionShape;

  refreshInFlight = (async () => {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      // On purge localement uniquement si le refresh token est réellement rejeté.
      if (res.status === 401 || res.status === 403) {
        clearStoredSession();
      }
      const msg =
        payload && typeof payload === "object" && (payload.message || payload.error)
          ? String(payload.message || payload.error)
          : `Refresh échoué (${res.status})`;
      throw new ApiError(msg, res.status, payload);
    }

    const session = payload as StoredSessionShape;
    if (
      !session ||
      typeof session.accessToken !== "string" ||
      typeof session.refreshToken !== "string" ||
      !session.user ||
      typeof session.user.id !== "string"
    ) {
      throw new ApiError("Réponse refresh invalide", 500, payload);
    }

    writeStoredSession(session);
    return session;
  })();

  try {
    return (await refreshInFlight) as StoredSessionShape;
  } finally {
    refreshInFlight = null;
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
      const refreshed = await refreshAccessToken(baseUrl);
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
      const refreshed = await refreshAccessToken(baseUrl);
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

