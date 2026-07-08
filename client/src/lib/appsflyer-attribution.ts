export type AppsFlyerAttribution = {
  mediaSource?: string | null;
  campaign?: string | null;
  adset?: string | null;
  adgroup?: string | null;
  keywords?: string | null;
  isRetargeting?: boolean | null;
  afSub1?: string | null;
  deepLinkValue?: string | null;
};

const PENDING_ATTRIBUTION_KEY = "one-more-pending-attribution-v1";

function normalizeAttribution(input: AppsFlyerAttribution): AppsFlyerAttribution {
  return {
    mediaSource: input.mediaSource?.trim() ? input.mediaSource.trim() : null,
    campaign: input.campaign?.trim() ? input.campaign.trim() : null,
    adset: input.adset?.trim() ? input.adset.trim() : null,
    adgroup: input.adgroup?.trim() ? input.adgroup.trim() : null,
    keywords: input.keywords?.trim() ? input.keywords.trim() : null,
    isRetargeting:
      typeof input.isRetargeting === "boolean" ? input.isRetargeting : null,
    afSub1: input.afSub1?.trim() ? input.afSub1.trim() : null,
    deepLinkValue: input.deepLinkValue?.trim() ? input.deepLinkValue.trim() : null,
  };
}

function mergePreferFirst(
  existing: AppsFlyerAttribution,
  incoming: AppsFlyerAttribution,
): AppsFlyerAttribution {
  return {
    mediaSource: existing.mediaSource ?? incoming.mediaSource,
    campaign: existing.campaign ?? incoming.campaign,
    adset: existing.adset ?? incoming.adset,
    adgroup: existing.adgroup ?? incoming.adgroup,
    keywords: existing.keywords ?? incoming.keywords,
    isRetargeting: existing.isRetargeting ?? incoming.isRetargeting,
    afSub1: existing.afSub1 ?? incoming.afSub1,
    deepLinkValue: existing.deepLinkValue ?? incoming.deepLinkValue,
  };
}

export function peekPendingAttribution():
  | AppsFlyerAttribution
  | null {
  try {
    const raw = localStorage.getItem(PENDING_ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppsFlyerAttribution;
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeAttribution(parsed);
  } catch {
    return null;
  }
}

export function setPendingAttribution(attribution: AppsFlyerAttribution): void {
  try {
    const normalized = normalizeAttribution(attribution);
    if (
      !normalized.mediaSource &&
      !normalized.campaign &&
      !normalized.adset &&
      !normalized.adgroup &&
      !normalized.keywords &&
      normalized.isRetargeting == null &&
      !normalized.afSub1 &&
      !normalized.deepLinkValue
    ) {
      return;
    }

    const existing = peekPendingAttribution();
    const next = existing ? mergePreferFirst(existing, normalized) : normalized;
    localStorage.setItem(PENDING_ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function consumePendingAttribution():
  | AppsFlyerAttribution
  | null {
  const current = peekPendingAttribution();
  if (!current) return null;
  try {
    localStorage.removeItem(PENDING_ATTRIBUTION_KEY);
  } catch {
    // ignore
  }
  return current;
}

export function clearPendingAttribution(): void {
  try {
    localStorage.removeItem(PENDING_ATTRIBUTION_KEY);
  } catch {
    // ignore
  }
}

