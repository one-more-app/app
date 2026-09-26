export type ReviewLastAnswer = "yes" | "no" | "dismissed" | "rest_over";

const MS_DAY = 24 * 60 * 60 * 1000;
const MIN_REST_REMAINING_MS = 30 * 1000;

export const REVIEW_COOLDOWN_DAYS_DEFAULT = 60;
export const REVIEW_COOLDOWN_DAYS_AFTER_REST_OVER = 14;
export const REVIEW_COOLDOWN_DAYS_AFTER_NO = 90;
export const REVIEW_COOLDOWN_DAYS_AFTER_STORE = 365;
export const REVIEW_MAX_SHOWS_PER_YEAR = 3;

export type ReviewPulseEligibilityInput = {
  isNativePlatform: boolean;
  todayDateKey: string;
  /** Jours distincts avec au moins une perf (non supprimée), triés ou non. */
  distinctSessionDateKeys: string[];
  firstSeenAtMs: number;
  nowMs: number;
  lastShownAtMs: number | null;
  shownAtMs: number[];
  lastAnswer: ReviewLastAnswer | null;
  storeOpenedAtMs: number | null;
  pulseShownSessionDate: string | null;
  sessionHadSyncError: boolean;
  restTimerEnabled: boolean;
  restBarVisible: boolean;
  restRemainingMs: number;
  perfDrawerOpen: boolean;
  celebrationQueueActive: boolean;
  onSessionRecapRoute: boolean;
};

function countShowsInLast365Days(shownAtMs: number[], nowMs: number): number {
  const cutoff = nowMs - 365 * MS_DAY;
  return shownAtMs.filter((t) => t >= cutoff).length;
}

const TRANSIENT_BLOCKERS = new Set([
  "celebration_active",
  "perf_drawer_open",
  "rest_timer_off",
  "rest_bar_hidden",
  "rest_remaining_low",
]);

export function getReviewPulseIneligibilityReasons(
  input: ReviewPulseEligibilityInput,
): string[] {
  const reasons: string[] = [];
  if (!input.isNativePlatform) reasons.push("not_native");
  if (input.onSessionRecapRoute) reasons.push("session_recap_route");
  if (input.perfDrawerOpen) reasons.push("perf_drawer_open");
  if (input.celebrationQueueActive) reasons.push("celebration_active");
  if (input.sessionHadSyncError) reasons.push("session_sync_error");

  if (input.pulseShownSessionDate === input.todayDateKey) {
    reasons.push("already_shown_today");
  }

  if (input.storeOpenedAtMs != null) {
    const sinceStore = input.nowMs - input.storeOpenedAtMs;
    if (sinceStore < REVIEW_COOLDOWN_DAYS_AFTER_STORE * MS_DAY) {
      reasons.push("store_opened_cooldown");
    }
  }

  if (input.lastAnswer === "no" && input.lastShownAtMs != null) {
    const since = input.nowMs - input.lastShownAtMs;
    if (since < REVIEW_COOLDOWN_DAYS_AFTER_NO * MS_DAY) {
      reasons.push("answered_no_cooldown");
    }
  }

  if (input.lastShownAtMs != null) {
    const since = input.nowMs - input.lastShownAtMs;
    const minDays =
      input.lastAnswer === "rest_over"
        ? REVIEW_COOLDOWN_DAYS_AFTER_REST_OVER
        : REVIEW_COOLDOWN_DAYS_DEFAULT;
    if (since < minDays * MS_DAY) {
      reasons.push("last_shown_cooldown");
    }
  }

  if (
    countShowsInLast365Days(input.shownAtMs, input.nowMs) >=
    REVIEW_MAX_SHOWS_PER_YEAR
  ) {
    reasons.push("max_shows_per_year");
  }

  if (!input.restTimerEnabled) reasons.push("rest_timer_off");
  if (!input.restBarVisible) reasons.push("rest_bar_hidden");
  if (input.restRemainingMs < MIN_REST_REMAINING_MS) {
    reasons.push("rest_remaining_low");
  }

  return reasons;
}

export function isTransientReviewPulseBlocker(reason: string): boolean {
  return TRANSIENT_BLOCKERS.has(reason);
}

export function canShowReviewPulse(input: ReviewPulseEligibilityInput): boolean {
  return getReviewPulseIneligibilityReasons(input).length === 0;
}

export type NativeRecapReviewInput = {
  isNativePlatform: boolean;
  sessionIsLive: boolean;
  hasPrInSession: boolean;
  pulseShownSessionDate: string | null;
  todayDateKey: string;
};

export function canRequestNativeReviewOnRecap(
  input: NativeRecapReviewInput,
): boolean {
  if (!input.isNativePlatform) return false;
  if (input.sessionIsLive) return false;
  if (!input.hasPrInSession) return false;
  if (input.pulseShownSessionDate === input.todayDateKey) return false;
  return true;
}

export function getRestRemainingMs(
  elapsedMs: number,
  targetMs: number,
): number {
  return Math.max(0, targetMs - elapsedMs);
}
