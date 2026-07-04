export function getOpenPanelClientId(): string | undefined {
  const id = process.env.OPENPANEL_CLIENT_ID?.trim();
  return id || undefined;
}

export function getOpenPanelClientSecret(): string | undefined {
  const secret = process.env.OPENPANEL_CLIENT_SECRET?.trim();
  return secret || undefined;
}

export function getOpenPanelApiUrl(): string {
  const raw = process.env.OPENPANEL_API_URL?.trim();
  if (!raw) return 'https://api.openpanel.dev';
  return raw.replace(/\/+$/, '');
}

export function isOpenPanelServerConfigured(): boolean {
  return Boolean(getOpenPanelClientId() && getOpenPanelClientSecret());
}
