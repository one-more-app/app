import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import {
  canShowReviewPulse,
  getRestRemainingMs,
  type ReviewPulseEligibilityInput,
} from "@/lib/review-eligibility";
import { getReviewStateSnapshot } from "@/lib/app-review";
import { isReviewPulsePlatformAllowed } from "@/lib/review-platform";
import { getDistinctSessionDateKeys } from "@/lib/review-session-dates";
import { sessionHadReviewBlockingSyncError } from "@/lib/review-session-sync-error";
import { isReviewPerfDrawerOpen } from "@/lib/review-perf-drawer-open";
import { getLocalDateKey } from "@/lib/local-date";

export function buildReviewPulseEligibilityInput(opts: {
  restTimerEnabled: boolean;
  restBarVisible: boolean;
  elapsedMs: number;
  targetMs: number;
  celebrationQueueActive: boolean;
  onSessionRecapRoute: boolean;
  nowMs?: number;
}): ReviewPulseEligibilityInput {
  const todayDateKey = getLocalDateKey();
  const state = getReviewStateSnapshot();
  const nowMs = opts.nowMs ?? Date.now();

  return {
    isNativePlatform: isReviewPulsePlatformAllowed(),
    todayDateKey,
    distinctSessionDateKeys: getDistinctSessionDateKeys(),
    firstSeenAtMs: state.firstSeenAtMs,
    nowMs,
    lastShownAtMs: state.lastShownAtMs,
    shownAtMs: state.shownAtMs,
    lastAnswer: state.lastAnswer,
    storeOpenedAtMs: state.storeOpenedAtMs,
    pulseShownSessionDate: state.pulseShownSessionDate,
    sessionHadSyncError: sessionHadReviewBlockingSyncError(todayDateKey),
    restTimerEnabled: opts.restTimerEnabled,
    restBarVisible: opts.restBarVisible,
    restRemainingMs: getRestRemainingMs(opts.elapsedMs, opts.targetMs),
    perfDrawerOpen: isReviewPerfDrawerOpen(),
    celebrationQueueActive: opts.celebrationQueueActive,
    onSessionRecapRoute: opts.onSessionRecapRoute,
  };
}

export function isReviewPulseEligibleNow(
  opts: Parameters<typeof buildReviewPulseEligibilityInput>[0],
): boolean {
  return canShowReviewPulse(buildReviewPulseEligibilityInput(opts));
}

export async function loadReviewAppVersion(): Promise<string> {
  try {
    const info = await App.getInfo();
    return info.version;
  } catch {
    return import.meta.env.VITE_APP_VERSION ?? "unknown";
  }
}

export async function loadReviewDeviceInfo(): Promise<{
  deviceModel?: string;
  osVersion?: string;
}> {
  if (!Capacitor.isNativePlatform()) return {};
  try {
    const { Device } = await import("@capacitor/device");
    const info = await Device.getInfo();
    return {
      deviceModel: info.model,
      osVersion: info.osVersion,
    };
  } catch {
    return {};
  }
}
