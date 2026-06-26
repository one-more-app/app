import { Capacitor } from "@capacitor/core";
import { syncPremiumStatus } from "@/lib/billing-api";
import { ACCESS_SWR_KEY } from "@/lib/social-api";
import { mutate } from "swr";

type PurchasesModule = typeof import("@revenuecat/purchases-capacitor");

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
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
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

export async function restorePurchases(): Promise<void> {
  const purchases = await getPurchases();
  if (!purchases) return;
  await purchases.Purchases.restorePurchases();
  await syncPremiumStatus();
  await mutate(ACCESS_SWR_KEY);
}

export async function presentPaywall(): Promise<boolean> {
  const purchases = await getPurchases();
  if (!purchases) return false;

  const offerings = await purchases.Purchases.getOfferings();
  const current = offerings.current;
  const packageToBuy = current?.availablePackages[0];
  if (!packageToBuy) return false;

  await purchases.Purchases.purchasePackage({ aPackage: packageToBuy });
  await syncPremiumStatus();
  await mutate(ACCESS_SWR_KEY);
  return true;
}

export async function syncPurchasesAfterLogin(userId: string): Promise<void> {
  if (!isPurchasesAvailable()) return;
  await configurePurchases(userId);
  const purchases = await getPurchases();
  if (!purchases) return;
  await purchases.Purchases.getCustomerInfo();
  await syncPremiumStatus();
  await mutate(ACCESS_SWR_KEY);
}
