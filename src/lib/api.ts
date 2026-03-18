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

function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === "string" && raw.trim()) return raw.trim().replace(/\/+$/, "");
  return "http://localhost:3000";
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { authToken?: string } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const { authToken, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...(headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await res.json().catch(() => null)) as unknown) : await res.text();

  if (!res.ok) {
    const p = payload as ApiErrorPayload | null;
    const msg =
      (p && typeof p === "object" && (p.message || p.error)) ||
      `Requête API échouée (${res.status})`;
    throw new ApiError(String(msg), res.status, payload);
  }
  return payload as T;
}

