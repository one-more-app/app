import type { AppsFlyerAttribution } from "@/lib/appsflyer-attribution";
import { peekPendingAttribution } from "@/lib/appsflyer-attribution";
import { AnalyticsEvents } from "./events";
import { getOpenPanel } from "./instance";
import type { AnalyticsProperties } from "./track";

const SNAPSHOT_KEY = "one-more-op-attribution-snapshot-v1";
const EVENT_SENT_KEY = "one-more-op-attribution-event-v1";

export type OpenPanelUtmQuery = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

type AttributionSnapshot = {
  attribution: AppsFlyerAttribution;
  utm: OpenPanelUtmQuery;
};

function trimOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mergePreferFirst(
  existing: OpenPanelUtmQuery,
  incoming: OpenPanelUtmQuery,
): OpenPanelUtmQuery {
  return {
    utm_source: existing.utm_source ?? incoming.utm_source,
    utm_medium: existing.utm_medium ?? incoming.utm_medium,
    utm_campaign: existing.utm_campaign ?? incoming.utm_campaign,
    utm_term: existing.utm_term ?? incoming.utm_term,
    utm_content: existing.utm_content ?? incoming.utm_content,
  };
}

function compactUtm(query: OpenPanelUtmQuery): OpenPanelUtmQuery {
  const out: OpenPanelUtmQuery = {};
  if (query.utm_source) out.utm_source = query.utm_source;
  if (query.utm_medium) out.utm_medium = query.utm_medium;
  if (query.utm_campaign) out.utm_campaign = query.utm_campaign;
  if (query.utm_term) out.utm_term = query.utm_term;
  if (query.utm_content) out.utm_content = query.utm_content;
  return out;
}

function hasUtm(query: OpenPanelUtmQuery): boolean {
  return Object.keys(compactUtm(query)).length > 0;
}

function hasAttributionSignal(attribution: AppsFlyerAttribution): boolean {
  return Boolean(
    trimOrNull(attribution.mediaSource) ||
      trimOrNull(attribution.campaign) ||
      trimOrNull(attribution.adset) ||
      trimOrNull(attribution.adgroup) ||
      trimOrNull(attribution.keywords) ||
      trimOrNull(attribution.afSub1) ||
      trimOrNull(attribution.deepLinkValue) ||
      typeof attribution.isRetargeting === "boolean",
  );
}

/** Medium OpenPanel Overview à partir des signaux AppsFlyer. */
export function deriveUtmMedium(
  attribution: AppsFlyerAttribution,
): string | null {
  const mediaSource = trimOrNull(attribution.mediaSource)?.toLowerCase() ?? "";
  const afSub1 = trimOrNull(attribution.afSub1)?.toLowerCase() ?? "";

  if (
    afSub1 === "invite" ||
    mediaSource === "friend_invite" ||
    mediaSource.includes("invite")
  ) {
    return "invite";
  }

  if (!mediaSource || mediaSource === "none" || mediaSource === "null") {
    if (
      trimOrNull(attribution.campaign) ||
      trimOrNull(attribution.adset) ||
      trimOrNull(attribution.adgroup)
    ) {
      return "cpc";
    }
    return null;
  }

  if (mediaSource === "organic") return "organic";
  return "cpc";
}

/** Mappe l’attribution AppsFlyer vers les UTM lus par l’Overview OpenPanel. */
export function attributionToUtmQuery(
  attribution: AppsFlyerAttribution,
): OpenPanelUtmQuery {
  const mediaSource = trimOrNull(attribution.mediaSource);
  const campaign = trimOrNull(attribution.campaign);
  const keywords = trimOrNull(attribution.keywords);
  const adset = trimOrNull(attribution.adset);
  const adgroup = trimOrNull(attribution.adgroup);
  const medium = deriveUtmMedium(attribution);
  const afSub1 = trimOrNull(attribution.afSub1)?.toLowerCase() ?? "";

  const source =
    mediaSource ??
    (afSub1 === "invite" || medium === "invite" ? "friend_invite" : null);

  return compactUtm({
    utm_source: source ?? undefined,
    utm_medium: medium ?? undefined,
    utm_campaign: campaign ?? undefined,
    utm_term: keywords ?? undefined,
    utm_content: adset ?? adgroup ?? undefined,
  });
}

/** Props plates pour profil / events (filtrables hors Overview). */
export function attributionToProfileProperties(
  attribution: AppsFlyerAttribution,
  utm: OpenPanelUtmQuery = attributionToUtmQuery(attribution),
): AnalyticsProperties {
  return {
    af_media_source: trimOrNull(attribution.mediaSource),
    af_campaign: trimOrNull(attribution.campaign),
    af_adset: trimOrNull(attribution.adset),
    af_adgroup: trimOrNull(attribution.adgroup),
    af_keywords: trimOrNull(attribution.keywords),
    af_is_retargeting:
      typeof attribution.isRetargeting === "boolean"
        ? attribution.isRetargeting
        : null,
    af_sub1: trimOrNull(attribution.afSub1),
    af_deep_link_value: trimOrNull(attribution.deepLinkValue),
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_term: utm.utm_term ?? null,
    utm_content: utm.utm_content ?? null,
  };
}

function readSnapshot(): AttributionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttributionSnapshot;
    if (!parsed?.attribution || !parsed?.utm) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: AttributionSnapshot): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

function hasSentAttributionEvent(): boolean {
  try {
    return sessionStorage.getItem(EVENT_SENT_KEY) === "1";
  } catch {
    return false;
  }
}

function markAttributionEventSent(): void {
  try {
    sessionStorage.setItem(EVENT_SENT_KEY, "1");
  } catch {
    // ignore
  }
}

function readUtmFromLocation(): OpenPanelUtmQuery {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return compactUtm({
      utm_source: trimOrNull(params.get("utm_source")) ?? undefined,
      utm_medium: trimOrNull(params.get("utm_medium")) ?? undefined,
      utm_campaign: trimOrNull(params.get("utm_campaign")) ?? undefined,
      utm_term: trimOrNull(params.get("utm_term")) ?? undefined,
      utm_content: trimOrNull(params.get("utm_content")) ?? undefined,
    });
  } catch {
    return {};
  }
}

/**
 * Pousse l’attribution vers OpenPanel :
 * - `__query` UTM → widget Sources de l’Overview
 * - props `af_*` / `utm_*` → profil + event
 */
export function applyAttributionToOpenPanel(
  attribution: AppsFlyerAttribution,
  options?: { source?: "appsflyer" | "web_url" },
): void {
  const incomingUtm = attributionToUtmQuery(attribution);
  if (!hasAttributionSignal(attribution) && !hasUtm(incomingUtm)) return;

  const op = getOpenPanel();
  if (!op) return;
  const existing = readSnapshot();
  const mergedUtm = compactUtm(
    mergePreferFirst(existing?.utm ?? {}, incomingUtm),
  );
  const mergedAttribution: AppsFlyerAttribution = {
    mediaSource: existing?.attribution.mediaSource ?? attribution.mediaSource,
    campaign: existing?.attribution.campaign ?? attribution.campaign,
    adset: existing?.attribution.adset ?? attribution.adset,
    adgroup: existing?.attribution.adgroup ?? attribution.adgroup,
    keywords: existing?.attribution.keywords ?? attribution.keywords,
    isRetargeting:
      existing?.attribution.isRetargeting ?? attribution.isRetargeting,
    afSub1: existing?.attribution.afSub1 ?? attribution.afSub1,
    deepLinkValue:
      existing?.attribution.deepLinkValue ?? attribution.deepLinkValue,
  };

  if (!hasUtm(mergedUtm) && !hasAttributionSignal(mergedAttribution)) return;

  const flat = attributionToProfileProperties(mergedAttribution, mergedUtm);
  const compactFlat: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value === null || value === undefined) continue;
    compactFlat[key] = value;
  }

  op.setGlobalProperties({
    ...compactFlat,
    ...(hasUtm(mergedUtm) ? { __query: mergedUtm } : {}),
  });

  writeSnapshot({ attribution: mergedAttribution, utm: mergedUtm });

  if (!hasSentAttributionEvent()) {
    void op.track(AnalyticsEvents.ATTRIBUTION_CAPTURED, {
      ...compactFlat,
      attribution_source: options?.source ?? "appsflyer",
      ...(hasUtm(mergedUtm) ? { __query: mergedUtm } : {}),
    });
    markAttributionEventSent();
  }
}

/** UTM présents dans l’URL web (landing / ads) — first-write, sans écraser AF. */
export function applyWebUtmFromLocation(): void {
  const utm = readUtmFromLocation();
  if (!hasUtm(utm)) return;

  const op = getOpenPanel();
  if (!op) return;

  const existing = readSnapshot();
  const mergedUtm = compactUtm(mergePreferFirst(existing?.utm ?? {}, utm));
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(mergedUtm)) {
    if (value) flat[key] = value;
  }

  op.setGlobalProperties({
    ...flat,
    __query: mergedUtm,
  });

  writeSnapshot({
    attribution: existing?.attribution ?? {
      mediaSource: mergedUtm.utm_source ?? null,
      campaign: mergedUtm.utm_campaign ?? null,
      keywords: mergedUtm.utm_term ?? null,
      adset: mergedUtm.utm_content ?? null,
    },
    utm: mergedUtm,
  });

  if (!hasSentAttributionEvent()) {
    void op.track(AnalyticsEvents.ATTRIBUTION_CAPTURED, {
      ...flat,
      attribution_source: "web_url",
      __query: mergedUtm,
    });
    markAttributionEventSent();
  }
}

/** Applique pending AF + UTM URL (idempotent, safe au boot analytics). */
export function syncPendingAttributionToOpenPanel(): void {
  applyWebUtmFromLocation();
  const pending = peekPendingAttribution();
  if (pending) applyAttributionToOpenPanel(pending, { source: "appsflyer" });
}

/** Props à merger dans `identify()` (snapshot session ou pending). */
export function getAttributionIdentifyProperties(): AnalyticsProperties {
  const snapshot = readSnapshot();
  if (snapshot) {
    return attributionToProfileProperties(snapshot.attribution, snapshot.utm);
  }
  const pending = peekPendingAttribution();
  if (!pending) return {};
  return attributionToProfileProperties(pending);
}
