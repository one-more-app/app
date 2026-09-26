import { describe, expect, it } from "vitest";
import {
  canShowReviewPulse,
  type ReviewPulseEligibilityInput,
  REVIEW_COOLDOWN_DAYS_AFTER_NO,
  REVIEW_COOLDOWN_DAYS_AFTER_REST_OVER,
  REVIEW_COOLDOWN_DAYS_AFTER_STORE,
  REVIEW_COOLDOWN_DAYS_DEFAULT,
} from "./review-eligibility";

const MS_DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-06-15T12:00:00.000Z");
const TODAY = "2026-06-15";

function base(overrides: Partial<ReviewPulseEligibilityInput> = {}): ReviewPulseEligibilityInput {
  return {
    isNativePlatform: true,
    todayDateKey: TODAY,
    distinctSessionDateKeys: [TODAY],
    firstSeenAtMs: NOW,
    nowMs: NOW,
    lastShownAtMs: null,
    shownAtMs: [],
    lastAnswer: null,
    storeOpenedAtMs: null,
    pulseShownSessionDate: null,
    sessionHadSyncError: false,
    restTimerEnabled: true,
    restBarVisible: true,
    restRemainingMs: 60_000,
    perfDrawerOpen: false,
    celebrationQueueActive: false,
    onSessionRecapRoute: false,
    ...overrides,
  };
}

describe("canShowReviewPulse", () => {
  it("accepte un compte neuf le jour de la première séance", () => {
    expect(
      canShowReviewPulse(
        base({
          distinctSessionDateKeys: [TODAY],
          firstSeenAtMs: NOW,
        }),
      ),
    ).toBe(true);
  });

  it("refuse si repos restant < 30 s", () => {
    expect(
      canShowReviewPulse(
        base({
          restRemainingMs: 29_000,
        }),
      ),
    ).toBe(false);
  });

  it("accepte si repos restant >= 30 s et le reste est ok", () => {
    expect(
      canShowReviewPulse(
        base({
          restRemainingMs: 30_000,
        }),
      ),
    ).toBe(true);
  });

  it("refuse un second PR le même jour (pulse déjà affichée)", () => {
    expect(
      canShowReviewPulse(
        base({
          pulseShownSessionDate: TODAY,
        }),
      ),
    ).toBe(false);
  });

  it("refuse après « no » avant 90 jours", () => {
    expect(
      canShowReviewPulse(
        base({
          lastAnswer: "no",
          lastShownAtMs: NOW - (REVIEW_COOLDOWN_DAYS_AFTER_NO - 1) * MS_DAY,
        }),
      ),
    ).toBe(false);
  });

  it("accepte après « no » à 90 jours", () => {
    expect(
      canShowReviewPulse(
        base({
          lastAnswer: "no",
          lastShownAtMs: NOW - REVIEW_COOLDOWN_DAYS_AFTER_NO * MS_DAY,
        }),
      ),
    ).toBe(true);
  });

  it("refuse si store ouvert il y a moins de 365 jours", () => {
    expect(
      canShowReviewPulse(
        base({
          storeOpenedAtMs: NOW - (REVIEW_COOLDOWN_DAYS_AFTER_STORE - 1) * MS_DAY,
        }),
      ),
    ).toBe(false);
  });

  it("refuse après 3 affichages dans l'année", () => {
    expect(
      canShowReviewPulse(
        base({
          shownAtMs: [
            NOW - 30 * MS_DAY,
            NOW - 60 * MS_DAY,
            NOW - 90 * MS_DAY,
          ],
        }),
      ),
    ).toBe(false);
  });

  it("refuse rest_over avant 14 jours depuis le dernier affichage", () => {
    expect(
      canShowReviewPulse(
        base({
          lastAnswer: "rest_over",
          lastShownAtMs:
            NOW - (REVIEW_COOLDOWN_DAYS_AFTER_REST_OVER - 1) * MS_DAY,
        }),
      ),
    ).toBe(false);
  });

  it("accepte rest_over à 14 jours", () => {
    expect(
      canShowReviewPulse(
        base({
          lastAnswer: "rest_over",
          lastShownAtMs: NOW - REVIEW_COOLDOWN_DAYS_AFTER_REST_OVER * MS_DAY,
        }),
      ),
    ).toBe(true);
  });

  it("refuse si erreur sync sur la séance du jour", () => {
    expect(
      canShowReviewPulse(
        base({
          sessionHadSyncError: true,
        }),
      ),
    ).toBe(false);
  });

  it("refuse si dernier affichage < 60 jours (hors rest_over)", () => {
    expect(
      canShowReviewPulse(
        base({
          lastShownAtMs: NOW - (REVIEW_COOLDOWN_DAYS_DEFAULT - 1) * MS_DAY,
        }),
      ),
    ).toBe(false);
  });
});
