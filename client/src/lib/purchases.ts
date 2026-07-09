import { Capacitor } from "@capacitor/core";
import { syncPremiumStatus } from "@/lib/billing-api";
import { TSHIRT_REWARD_SWR_KEY } from "@/lib/rewards-api";
import { ACCESS_SWR_KEY } from "@/lib/social-api";
import { mutate } from "swr";

type PurchasesModule = typeof import("@revenuecat/purchases-capacitor");
type PurchasesPackage =
  import("@revenuecat/purchases-capacitor").PurchasesPackage;
type PurchasesOffering =
  import("@revenuecat/purchases-capacitor").PurchasesOffering;

export type PurchaseOutcome = "purchased" | "cancelled" | "error";

export type CurrentOffering = {
  offering: PurchasesOffering;
  annual: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
};

let purchasesModule: PurchasesModule | null = null;
let configuredForUserId: string | null = null;

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

export async function syncPurchasesAfterLogin(userId: string): Promise<void> {
  if (!isPurchasesAvailable()) return;
  await configurePurchases(userId);
  const purchases = await getPurchases();
  if (!purchases) return;
  await purchases.Purchases.getCustomerInfo();
  await syncPremiumStatus();
  await refreshBillingCaches();
}
