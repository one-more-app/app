import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeagueInfo } from "@/lib/strength-standards";
import {
  advanceCelebrationQueue,
  clearCelebrationQueue,
  getCelebrationSnapshot,
} from "@/lib/celebration-queue";

vi.mock("@/lib/analytics", () => ({
  trackLeaguePromoted: vi.fn(),
  trackPersonalRecordBroken: vi.fn(),
}));

vi.mock("@/lib/review-pr-today", () => ({
  markReviewPrLoggedToday: vi.fn(),
}));

vi.mock("@/lib/haptics", () => ({
  hapticImpact: vi.fn(),
  hapticImpactHeavy: vi.fn(),
  hapticImpactMedium: vi.fn(),
  hapticNotificationSuccess: vi.fn(),
}));

vi.mock("@/lib/milestone-sound", () => ({
  playMilestoneSound: vi.fn(),
}));

import { notifyPerfMilestones } from "./perf-notifications";

function league(rankId: LeagueInfo["rankId"], tier: LeagueInfo["tier"]): LeagueInfo {
  return {
    rankId,
    tier,
    subRank: 1,
    label: rankId,
    tierLabel: tier,
    oneRM: 100,
    weightTierStart: 80,
    weightTierEnd: 120,
    ratioMin: 1,
    ratioNext: 1.2,
    weightToReach: 120,
    progressToNext: 0.5,
    percentileEstimate: 50,
    nextRankId: null,
    metric: "kg",
  };
}

function drainCelebrationKinds(): string[] {
  const kinds: string[] = [];
  let guard = 0;
  while (getCelebrationSnapshot().current && guard < 10) {
    kinds.push(getCelebrationSnapshot().current!.kind);
    advanceCelebrationQueue();
    guard += 1;
  }
  return kinds;
}

describe("notifyPerfMilestones", () => {
  beforeEach(() => {
    clearCelebrationQueue();
  });

  afterEach(() => {
    clearCelebrationQueue();
  });

  it("n'affiche que le passage de palier quand record et promotion coïncident", () => {
    notifyPerfMilestones({
      exerciseName: "Développé couché",
      prevPB: { weight: 80, reps: 5 },
      nextPB: { weight: 100, reps: 5 },
      savedWeight: 100,
      savedReps: 5,
      league: {
        before: league("bronze_3", "bronze"),
        after: league("silver_1", "silver"),
        promoted: true,
      },
    });

    expect(drainCelebrationKinds()).toEqual(["league"]);
  });

  it("affiche encore la célébration record sans passage de palier", () => {
    notifyPerfMilestones({
      exerciseName: "Développé couché",
      prevPB: { weight: 80, reps: 5 },
      nextPB: { weight: 85, reps: 5 },
      savedWeight: 85,
      savedReps: 5,
      league: {
        before: league("bronze_3", "bronze"),
        after: league("bronze_3", "bronze"),
        promoted: false,
      },
    });

    expect(drainCelebrationKinds()).toEqual(["record"]);
  });
});
