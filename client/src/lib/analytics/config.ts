/** Variables Vite — client ID et URL API OpenPanel (figées au build mobile). */

const DEFAULT_API_URL = "https://api.openpanel.dev";

export function getOpenPanelClientId(): string | undefined {
  const id = import.meta.env.VITE_OPENPANEL_CLIENT_ID?.trim();
  return id || undefined;
}

export function getOpenPanelApiUrl(): string {
  const raw = import.meta.env.VITE_OPENPANEL_API_URL?.trim();
  if (!raw) return DEFAULT_API_URL;
  return raw.replace(/\/+$/, "");
}

export function isOpenPanelConfigured(): boolean {
  return Boolean(getOpenPanelClientId());
}
