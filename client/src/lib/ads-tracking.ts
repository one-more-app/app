import { Capacitor } from "@capacitor/core";
import { AdsTracking } from "ads-tracking";

export type AttAuthorizationStatus =
  | "authorized"
  | "denied"
  | "restricted"
  | "notDetermined"
  | "unavailable";

export function shouldPromptAtt(status: AttAuthorizationStatus): boolean {
  return status === "notDetermined";
}

export function isTrackingAuthorized(status: AttAuthorizationStatus): boolean {
  return status === "authorized";
}

/**
 * ATT iOS après init AppsFlyer (`waitForATTUserAuthorization`).
 * No-op hors iOS. Ne redemande jamais si l’utilisateur a déjà répondu.
 */
export async function requestAdsTrackingIfNeeded(): Promise<AttAuthorizationStatus> {
  if (Capacitor.getPlatform() !== "ios") return "unavailable";
  try {
    // requestPermission ne re-prompt pas si déjà répondu ; resync ATE Meta à chaque launch.
    const next = await AdsTracking.requestPermission();
    return next.status;
  } catch (err) {
    console.warn("[AdsTracking] ATT failed", err);
    return "unavailable";
  }
}
