import { Capacitor } from "@capacitor/core";

/**
 * Review pulse is shipped for native only.
 * In DEV, web is allowed so the drawer / feedback flow can be debugged in the browser.
 */
export function isReviewPulsePlatformAllowed(): boolean {
  return Capacitor.isNativePlatform() || import.meta.env.DEV;
}
