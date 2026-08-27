import { afterEach, describe, expect, it } from "vitest";
import {
  clearRestTimerExcludedPerformances,
  excludePerformanceFromRestTimer,
  isPerformanceExcludedFromRestTimer,
} from "./rest-timer-exclude";

afterEach(() => {
  clearRestTimerExcludedPerformances();
});

describe("rest-timer-exclude", () => {
  it("ignore la perf d'onboarding pour le chrono", () => {
    excludePerformanceFromRestTimer("perf-onboarding");

    expect(isPerformanceExcludedFromRestTimer("perf-onboarding")).toBe(true);
    expect(isPerformanceExcludedFromRestTimer("perf-reelle")).toBe(false);
  });

  it("oublie les exclusions au reset de session", () => {
    excludePerformanceFromRestTimer("perf-onboarding");
    clearRestTimerExcludedPerformances();

    expect(isPerformanceExcludedFromRestTimer("perf-onboarding")).toBe(false);
  });
});
