export function getPublicApiUrl(): string {
  const raw =
    process.env.PUBLIC_API_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim() ||
    'https://api.one-more.app';
  return raw.replace(/\/+$/, '');
}

export function buildUnsubscribeUrl(token: string): string {
  return `${getPublicApiUrl()}/u/${encodeURIComponent(token)}`;
}
