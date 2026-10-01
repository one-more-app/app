// client/src/lib/app-store.ts
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const ANDROID_PACKAGE = "com.one_more.app";

/** Fiche Play Store HTTPS (aussi dernier recours si l'ID Apple est absent). */
const PLAY_STORE_LISTING_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

function getAppleAppId(): string | undefined {
  const id = import.meta.env.VITE_APPLE_APP_ID;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

/**
 * Fiche store HTTPS (sans write-review) pour forcer la mise à jour.
 * HTTPS uniquement : `Browser.open` (Custom Tabs / SFSafariViewController)
 * ne gère pas `market://`.
 */
export function getAppStoreListingUrl(): string {
  if (Capacitor.getPlatform() === "ios") {
    const appId = getAppleAppId();
    if (appId) return `https://apps.apple.com/app/id${appId}`;
  }
  return PLAY_STORE_LISTING_URL;
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
