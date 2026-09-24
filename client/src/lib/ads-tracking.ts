import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { AdsTracking } from "ads-tracking";

import { subscribeAppStateChange } from "@/lib/app-state-listener";

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

/** iOS n’affiche l’ATT que si l’app est `active` (pas le splash). */
export function canPresentAttPrompt(isActive: boolean): boolean {
  return isActive;
}

async function waitUntilAppActive(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const state = await CapacitorApp.getState();
  if (canPresentAttPrompt(state.isActive)) return;

  await new Promise<void>((resolve) => {
    const unsubscribe = subscribeAppStateChange((isActive) => {
      if (!canPresentAttPrompt(isActive)) return;
      unsubscribe();
      resolve();
    });
  });
}

function waitForNextPaints(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * ATT iOS après que l’app soit au premier plan.
 * No-op hors iOS. Ne redemande jamais si l’utilisateur a déjà répondu.
 */
export async function requestAdsTrackingIfNeeded(): Promise<AttAuthorizationStatus> {
  if (Capacitor.getPlatform() !== "ios") return "unavailable";
  try {
    const next = await AdsTracking.requestPermission();
    return next.status;
  } catch (err) {
    console.warn("[AdsTracking] ATT failed", err);
    return "unavailable";
  }
}

/** Attend `active` + 2 frames, sinon iOS file le prompt et il sort 1–2 min plus tard. */
export async function requestAdsTrackingWhenAppActive(): Promise<AttAuthorizationStatus> {
  if (Capacitor.getPlatform() !== "ios") return "unavailable";
  await waitUntilAppActive();
  if (typeof requestAnimationFrame === "function") {
    await waitForNextPaints();
  }
  return requestAdsTrackingIfNeeded();
}
