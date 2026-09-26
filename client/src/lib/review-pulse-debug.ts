import { Capacitor } from "@capacitor/core";
import { getReviewStateSnapshot } from "@/lib/app-review";
import { buildReviewPulseEligibilityInput } from "@/lib/review-build-context";
import { getReviewPulseIneligibilityReasons } from "@/lib/review-eligibility";
import { getDistinctSessionDateKeys } from "@/lib/review-session-dates";
import { sessionHadReviewBlockingSyncError } from "@/lib/review-session-sync-error";
import { getLocalDateKey } from "@/lib/local-date";
import { isReviewPerfDrawerOpen } from "@/lib/review-perf-drawer-open";

/** À appeler depuis la console (dev) : `__reviewPulseDebug()` */
export function logReviewPulseDebug(opts?: {
  restTimerEnabled?: boolean;
  restBarVisible?: boolean;
  elapsedMs?: number;
  targetMs?: number;
  celebrationQueueActive?: boolean;
}): void {
  const today = getLocalDateKey();
  const input = buildReviewPulseEligibilityInput({
    restTimerEnabled: opts?.restTimerEnabled ?? true,
    restBarVisible: opts?.restBarVisible ?? true,
    elapsedMs: opts?.elapsedMs ?? 0,
    targetMs: opts?.targetMs ?? 90_000,
    celebrationQueueActive: opts?.celebrationQueueActive ?? false,
    onSessionRecapRoute: false,
  });
  const reasons = getReviewPulseIneligibilityReasons(input);
  console.table({
    native: Capacitor.isNativePlatform(),
    today,
    distinctSessionDays: getDistinctSessionDateKeys().length,
    perfDrawerOpen: isReviewPerfDrawerOpen(),
    syncErrorToday: sessionHadReviewBlockingSyncError(today),
    ...getReviewStateSnapshot(),
    blocked: reasons.join(", ") || "(ok)",
  });
}

declare global {
  interface Window {
    __reviewPulseDebug?: typeof logReviewPulseDebug;
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__reviewPulseDebug = logReviewPulseDebug;
}
