import { Capacitor } from "@capacitor/core";
import { syncPremiumStatus } from "@/lib/billing-api";
import { resolveProfileName } from "@/lib/profile-display";
import { TSHIRT_REWARD_SWR_KEY } from "@/lib/rewards-api";
import { ACCESS_SWR_KEY } from "@/lib/social-api";
import { mutate } from "swr";

type PurchasesModule = typeof import("@revenuecat/purchases-capacitor");
type PurchasesPackage =
  import("@revenuecat/purchases-capacitor").PurchasesPackage;
type PurchasesOffering =
  import("@revenuecat/purchases-capacitor").PurchasesOffering;

export type PurchaseOutcome = "purchased" | "cancelled" | "error";

export type RevenueCatSubscriberInfo = {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  gender?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  mediaSource?: string | null;
  campaign?: string | null;
  adset?: string | null;
  adgroup?: string | null;
  keywords?: string | null;
  sub1?: string | null;
};

export type CurrentOffering = {
  offering: PurchasesOffering;
  annual: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
};

let purchasesModule: PurchasesModule | null = null;
let configuredForUserId: string | null = null;
let lastSyncedSubscriberFingerprint: string | null = null;

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildSubscriberFingerprint(info: RevenueCatSubscriberInfo): string {
  return JSON.stringify(info);
}

export async function syncRevenueCatSubscriberInfo(
  info: RevenueCatSubscriberInfo,
): Promise<void> {
  const purchases = await getPurchases();
  if (!purchases) return;

  const fingerprint = buildSubscriberFingerprint(info);
  if (fingerprint === lastSyncedSubscriberFingerprint) return;
  lastSyncedSubscriberFingerprint = fingerprint;

  const { Purchases } = purchases;
  const resolvedName = resolveProfileName(
    {
      firstName: info.firstName ?? undefined,
      lastName: info.lastName ?? undefined,
      username: info.username ?? undefined,
    },
    { id: info.userId, email: info.email ?? null },
  );
  const displayName = resolvedName.fullName;

  const tasks: Promise<void>[] = [];

  if (info.email !== undefined) {
    tasks.push(Purchases.setEmail({ email: trimOrNull(info.email) }));
  }
  tasks.push(Purchases.setDisplayName({ displayName }));

  const customAttributes: Record<string, string | null> = {
    first_name: trimOrNull(info.firstName ?? null),
    last_name: trimOrNull(info.lastName ?? null),
    username: trimOrNull(info.username ?? null),
    gender: trimOrNull(info.gender ?? null),
    user_id: info.userId,
  };

  if (info.weightKg != null) {
    customAttributes.weight_kg = String(info.weightKg);
  }
  if (info.heightCm != null) {
    customAttributes.height_cm = String(info.heightCm);
  }
  if (info.adset != null) {
    customAttributes.adset = trimOrNull(info.adset);
  }
  if (info.sub1 != null) {
    customAttributes.af_sub1 = trimOrNull(info.sub1);
  }

  tasks.push(Purchases.setAttributes(customAttributes));

  if (info.mediaSource !== undefined) {
    tasks.push(
      Purchases.setMediaSource({ mediaSource: trimOrNull(info.mediaSource) }),
    );
  }
  if (info.campaign !== undefined) {
    tasks.push(Purchases.setCampaign({ campaign: trimOrNull(info.campaign) }));
  }
  if (info.adgroup !== undefined) {
    tasks.push(Purchases.setAdGroup({ adGroup: trimOrNull(info.adgroup) }));
  }
  if (info.keywords !== undefined) {
    tasks.push(Purchases.setKeyword({ keyword: trimOrNull(info.keywords) }));
  }

  tasks.push(Purchases.collectDeviceIdentifiers());

  try {
    await Promise.all(tasks);
  } catch {
    lastSyncedSubscriberFingerprint = null;
  }
}

function getRevenueCatApiKey(): string | null {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_API_KEY_IOS?.trim() || null;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID?.trim() || null;
  }
  return null;
}

async function getPurchases(): Promise<PurchasesModule | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!purchasesModule) {
    purchasesModule = await import("@revenuecat/purchases-capacitor");
  }
  return purchasesModule;
}

export function isPurchasesAvailable(): boolean {
  return Capacitor.isNativePlatform() && getRevenueCatApiKey() != null;
}

export async function configurePurchases(userId: string): Promise<void> {
  const apiKey = getRevenueCatApiKey();
  const purchases = await getPurchases();
  if (!apiKey || !purchases) return;

  if (configuredForUserId === userId) return;

  const { Purchases, LOG_LEVEL } = purchases;
  await Purchases.setLogLevel({ level: LOG_LEVEL.VERBOSE });
  await Purchases.configure({ apiKey, appUserID: userId });
  configuredForUserId = userId;
}

export async function logOutPurchases(): Promise<void> {
  const purchases = await getPurchases();
  if (!purchases) return;
  try {
    await purchases.Purchases.logOut();
  } catch {
    // ignore if not configured
  }
  configuredForUserId = null;
  lastSyncedSubscriberFingerprint = null;
}

async function refreshBillingCaches(): Promise<void> {
  await Promise.all([
    mutate(ACCESS_SWR_KEY),
    mutate(TSHIRT_REWARD_SWR_KEY),
  ]);
}

export async function restorePurchases(): Promise<void> {
  const purchases = await getPurchases();
  if (!purchases) return;
  await purchases.Purchases.restorePurchases();
  await syncPremiumStatus();
  await refreshBillingCaches();
}

export async function getCurrentOffering(): Promise<CurrentOffering | null> {
  const purchases = await getPurchases();
  if (!purchases) return null;

  const offerings = await purchases.Purchases.getOfferings();
  const offering = offerings.current;
  if (!offering) return null;

  return {
    offering,
    annual: offering.annual ?? null,
    monthly: offering.monthly ?? null,
  };
}

export async function purchasePackage(
  aPackage: PurchasesPackage,
): Promise<PurchaseOutcome> {
  const purchases = await getPurchases();
  if (!purchases) return "error";

  try {
    await purchases.Purchases.purchasePackage({ aPackage });
    await syncPremiumStatus();
    await refreshBillingCaches();
    return "purchased";
  } catch (error) {
    if (isUserCancelledError(error)) return "cancelled";
    return "error";
  }
}

function isUserCancelledError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  if (record.userCancelled === true) return true;
  if (record.code === "1") return true;
  if (typeof record.message === "string" && /cancel/i.test(record.message)) {
    return true;
  }
  return false;
}

export async function syncPurchasesAfterLogin(
  userId: string,
  subscriber?: RevenueCatSubscriberInfo,
): Promise<void> {
  if (!isPurchasesAvailable()) return;
  await configurePurchases(userId);
  const purchases = await getPurchases();
  if (!purchases) return;
  if (subscriber) {
    await syncRevenueCatSubscriberInfo(subscriber);
  }
  await purchases.Purchases.getCustomerInfo();
  await syncPremiumStatus();
  await refreshBillingCaches();
}
