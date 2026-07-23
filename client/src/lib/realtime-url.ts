function getApiBaseUrl(): string {
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

export function getRealtimeSocketUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith("https://")) {
    return `${base.replace(/^https:/, "wss:")}/realtime`;
  }
  if (base.startsWith("http://")) {
    return `${base.replace(/^http:/, "ws:")}/realtime`;
  }
  return `${base}/realtime`;
}

/** Namespace public stand event (TV / admin), sans JWT. */
export function getEventRealtimeSocketUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith("https://")) {
    return `${base.replace(/^https:/, "wss:")}/event`;
  }
  if (base.startsWith("http://")) {
    return `${base.replace(/^http:/, "ws:")}/event`;
  }
  return `${base}/event`;
}
