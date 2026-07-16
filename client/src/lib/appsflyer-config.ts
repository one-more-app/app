/** Variables Vite (build mobile) — voir docs/appsflyer-setup.md */

export function getAppsFlyerDevKey(): string | undefined {
  const key = import.meta.env.VITE_APPSFLYER_DEV_KEY?.trim();
  return key || undefined;
}

/** ID App Store numérique (iOS uniquement). */
export function getAppsFlyerAppId(): string | undefined {
  const id = import.meta.env.VITE_APPSFLYER_APP_ID?.trim();
  return id || undefined;
}

/** ID du template OneLink (segment d’URL, ex. `H5hv`). */
export function getAppsFlyerOneLinkId(): string | undefined {
  const id = import.meta.env.VITE_APPSFLYER_ONELINK_ID?.trim();
  return id || undefined;
}

/** Sous-domaine OneLink, ex. `one-more.onelink.me` (sans https). */
export function getAppsFlyerOneLinkDomain(): string | undefined {
  const raw = import.meta.env.VITE_APPSFLYER_ONELINK_DOMAIN?.trim();
  if (!raw) return undefined;
  return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** Domaine branded OneLink optionnel (ex. `invite.one-more.app`). */
export function getAppsFlyerBrandedDomains(): string[] {
  const raw = import.meta.env.VITE_APPSFLYER_BRANDED_DOMAINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((d: string) => d.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
    .filter(Boolean);
}

export function isAppsFlyerConfigured(): boolean {
  return Boolean(getAppsFlyerDevKey());
}

/** Défauts prod si les `VITE_*` manquent (ex. `vite` web sans `.env.*.capacitor`). */
const DEFAULT_ONELINK_DOMAIN = "one-more.onelink.me";
const DEFAULT_ONELINK_ID = "XFST";

export function buildOneLinkInviteUrl(code: string): string | null {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  const domain = getAppsFlyerOneLinkDomain() ?? DEFAULT_ONELINK_DOMAIN;
  const templateId = getAppsFlyerOneLinkId() ?? DEFAULT_ONELINK_ID;

  const params = new URLSearchParams({
    deep_link_value: normalized,
    pid: "friend_invite",
  });
  return `https://${domain}/${templateId}?${params.toString()}`;
}
