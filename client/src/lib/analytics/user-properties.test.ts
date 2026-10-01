import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./onboarding-tracking", () => ({
  getOnboardingLastStep: () => "home",
  getOnboardingSignupMethod: () => "email",
}));

vi.mock("./attribution", () => ({
  getAttributionIdentifyProperties: () => ({
    utm_source: "reddit_int",
  }),
}));

vi.mock("@/lib/storage", () => ({
  isOnboardingMarkedDone: () => true,
}));

import { buildIdentifyTraits, buildUsageIdentifyProperties } from "./user-properties";
import type { UserAccess } from "@/lib/social-api";

const access: UserAccess = {
  exerciseLimit: 8,
  activeExerciseCount: 3,
  canAddExercise: true,
  referralCount: 2,
  hasUsedReferralCode: true,
  bonusFromReferrals: 4,
  bonusFromBeingReferred: 2,
  isPremium: false,
  tshirtRewardEligible: false,
  referralsUntilTshirt: 3,
  referralRewardKind: null,
};

describe("buildUsageIdentifyProperties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes monetization and referral usage traits", () => {
    const props = buildUsageIdentifyProperties({ access });
    expect(props).toMatchObject({
      is_premium: false,
      plan: "free",
      exercise_count: 3,
      exercise_limit: 8,
      can_add_exercise: true,
      referral_count: 2,
      has_used_referral_code: true,
      tshirt_reward_eligible: false,
      referrals_until_tshirt: 3,
      referral_reward_kind: null,
      onboarding_completed: true,
      signup_method: "email",
      utm_source: "reddit_int",
    });
  });

  it("adds lean product profile traits when available", () => {
    const props = buildUsageIdentifyProperties({
      access,
      profile: {
        weightKg: 80,
        heightCm: 180,
        gender: "male",
        trainingGoal: "muscle",
        trainingExperience: "intermediate",
        sessionsPerWeek: "moderate",
        avatarUrl: "https://cdn.example/a.jpg",
        firstName: "Vince",
        discoverySource: "social",
      },
    });
    expect(props.gender).toBe("male");
    expect(props.training_goal).toBe("muscle");
    expect(props.training_experience).toBe("intermediate");
    expect(props.sessions_per_week).toBe("moderate");
    expect(props.has_avatar).toBe(true);
    expect(props.discovery_source).toBe("social");
    expect(props.age_years).toBeUndefined();
    expect(props.weight_kg).toBe(80);
    expect(props.height_cm).toBe(180);
  });

  it("includes age when set", () => {
    const props = buildUsageIdentifyProperties({
      profile: {
        weightKg: 70,
        heightCm: 170,
        gender: "female",
        ageYears: 28,
      },
    });
    expect(props.age_years).toBe(28);
  });
});

describe("buildIdentifyTraits", () => {
  it("maps OpenPanel standard traits", () => {
    expect(
      buildIdentifyTraits({
        weightKg: 70,
        heightCm: 170,
        gender: "female",
        firstName: "Ada",
        lastName: "Lovelace",
        avatarUrl: "https://cdn.example/a.jpg",
      }),
    ).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      avatar: "https://cdn.example/a.jpg",
    });
  });
});
