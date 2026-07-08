import { Capacitor } from "@capacitor/core";
import { AppsFlyer, AFConstants } from "appsflyer-capacitor-plugin";

import {
  buildOneLinkInviteUrl,
  getAppsFlyerAppId,
  getAppsFlyerBrandedDomains,
  getAppsFlyerDevKey,
  getAppsFlyerOneLinkId,
  isAppsFlyerConfigured,
} from "@/lib/appsflyer-config";
import { setPendingInviteCode } from "@/lib/invite-code";
import { setPendingAttribution } from "@/lib/appsflyer-attribution";

const INVITE_ATTRIBUTION_KEYS = [
  "deep_link_value",
  "invite_code",
  "af_sub1",
] as const;

let initPromise: Promise<void> | null = null;

export function extractInviteCodeFromAttribution(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  for (const key of INVITE_ATTRIBUTION_KEYS) {
    const raw = data[key];
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim().toLowerCase();
    }
  }
  return null;
}

export function extractInviteCodeFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const hash = url.hash.replace(/^#\/?/, "");
    const inviteMatch = hash.match(/^invite\/([^/?#]+)/);
    if (inviteMatch?.[1]) return inviteMatch[1].trim().toLowerCase();

    const pathInvite = url.pathname.match(/\/invite\/([^/]+)/);
    if (pathInvite?.[1]) return pathInvite[1].trim().toLowerCase();

    return extractInviteCodeFromAttribution(
      Object.fromEntries(url.searchParams.entries()),
    );
  } catch {
    return null;
  }
}

export function persistAndNavigateToInvite(code: string): void {
  const normalizedCode = code.trim().toLowerCase();
  if (!normalizedCode) return;
  setPendingInviteCode(normalizedCode);
  const target = `#/invite/${encodeURIComponent(normalizedCode)}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

function applyInviteAttribution(data: Record<string, unknown> | null | undefined): void {
  const code = extractInviteCodeFromAttribution(data);
  if (!code) return;

  persistAndNavigateToInvite(code);
}

function getStringValue(
  data: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): string | null {
  if (!data) return null;
  for (const key of keys) {
    const raw = data[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return null;
}

function getBooleanValue(
  data: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): boolean | null {
  if (!data) return null;
  for (const key of keys) {
    const raw = data[key];
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") {
      const v = raw.trim().toLowerCase();
      if (v === "true") return true;
      if (v === "false") return false;
    }
  }
  return null;
}

function extractAdsAttribution(
  data: Record<string, unknown> | null | undefined,
): {
  mediaSource?: string | null;
  campaign?: string | null;
  adset?: string | null;
  adgroup?: string | null;
  keywords?: string | null;
  isRetargeting?: boolean | null;
  afSub1?: string | null;
  deepLinkValue?: string | null;
} | null {
  if (!data) return null;

  const mediaSource = getStringValue(data, ["media_source", "mediaSource"]);
  const campaign = getStringValue(data, ["campaign"]);
  const adset = getStringValue(data, ["adset"]);
  const adgroup = getStringValue(data, ["adgroup"]);
  const keywords = getStringValue(data, ["keywords"]);
  const isRetargeting = getBooleanValue(data, ["is_retargeting", "isRetargeting"]);
  const afSub1 = getStringValue(data, ["af_sub1"]);
  const deepLinkValue = getStringValue(data, ["deep_link_value", "deepLinkValue"]);

  if (
    !mediaSource &&
    !campaign &&
    !adset &&
    !adgroup &&
    !keywords &&
    isRetargeting == null &&
    !afSub1 &&
    !deepLinkValue
  ) {
    return null;
  }

  return {
    mediaSource,
    campaign,
    adset,
    adgroup,
    keywords,
    isRetargeting,
    afSub1,
    deepLinkValue,
  };
}

function registerAppsFlyerListeners(): void {
  AppsFlyer.addListener(AFConstants.UDL_CALLBACK, (event) => {
    if (event.status === "FOUND" && event.deepLink) {
      const deepLink = event.deepLink as Record<string, unknown>;
      applyInviteAttribution(deepLink);

      const attribution = extractAdsAttribution(deepLink);
      if (attribution) setPendingAttribution(attribution);
    }
  });

  AppsFlyer.addListener(AFConstants.CONVERSION_CALLBACK, (event) => {
    if (event.callbackName !== AFConstants.onConversionDataSuccess) return;
    const data = event.data as Record<string, unknown> | undefined;
    if (!data) return;

    const isFirstLaunch =
      data.is_first_launch === true || data.is_first_launch === "true";
    if (!isFirstLaunch) return;

    applyInviteAttribution(data);

    const attribution = extractAdsAttribution(data);
    if (attribution) setPendingAttribution(attribution);
  });
}

/**
 * Initialise AppsFlyer sur natif (listeners avant initSDK, cf. doc UDL).
 * No-op sur web ou si VITE_APPSFLYER_DEV_KEY est absent.
 */
export function setupAppsFlyer(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isAppsFlyerConfigured()) {
    return Promise.resolve();
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    registerAppsFlyerListeners();

    const onelinkId = getAppsFlyerOneLinkId();
    if (onelinkId) {
      await AppsFlyer.setAppInviteOneLink({ onelinkID: onelinkId });
    }

    const branded = getAppsFlyerBrandedDomains();
    if (branded.length > 0) {
      await AppsFlyer.setOneLinkCustomDomain({ domains: branded });
    }

    const devKey = getAppsFlyerDevKey()!;
    const appID = getAppsFlyerAppId() ?? "";

    await AppsFlyer.initSDK({
      devKey,
      appID,
      isDebug: import.meta.env.DEV,
      registerConversionListener: true,
      registerOnDeepLink: true,
    });
  })().catch((err) => {
    initPromise = null;
    console.warn("[AppsFlyer] init failed", err);
  });

  return initPromise;
}

export async function syncAppsFlyerCustomerUserId(
  userId: string | null,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isAppsFlyerConfigured()) return;
  await setupAppsFlyer();
  if (!userId) return;
  try {
    await AppsFlyer.setCustomerUserId({ cuid: userId });
  } catch {
    // ignore
  }
}

/**
 * Génère un lien OneLink User Invite (natif). Retombe sur l’URL API / build statique sinon.
 */
export async function generateAppsFlyerInviteUrl(
  inviteCode: string,
  referrerUserId?: string,
): Promise<string | null> {
  const fallback = buildOneLinkInviteUrl(inviteCode);
  if (!Capacitor.isNativePlatform() || !isAppsFlyerConfigured()) {
    return fallback;
  }

  await setupAppsFlyer();

  const onelinkId = getAppsFlyerOneLinkId();
  if (!onelinkId) return fallback;

  try {
    const result = await AppsFlyer.generateInviteLink({
      channel: "share",
      campaign: "friend_invite",
      referrerCustomerId: referrerUserId,
      addParameters: {
        deep_link_value: inviteCode,
        invite_code: inviteCode,
      },
    });
    return result.link?.trim() || fallback;
  } catch {
    return fallback;
  }
}
