// client/src/lib/app-store.ts
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const ANDROID_PACKAGE = "com.one_more.app";

function getAppleAppId(): string | undefined {
  const id = import.meta.env.VITE_APPLE_APP_ID;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

/** Fiche store (sans write-review) pour forcer la mise à jour. */
export function getAppStoreListingUrl(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    const appId = getAppleAppId();
    if (appId) return `https://apps.apple.com/app/id${appId}`;
    return "https://apps.apple.com/app/id000000000";
  }
  if (platform === "android") {
    return `market://details?id=${ANDROID_PACKAGE}`;
  }
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
}

export async function openAppStoreForUpdate(): Promise<void> {
  const url = getAppStoreListingUrl();
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
  } catch {
    // fallback below
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
