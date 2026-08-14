import { describe, expect, it } from "vitest";
import {
  OnboardingSteps,
  bodyStepFromQuestion,
  gymStepFromSubStep,
  resolveOnboardingStepFromLocation,
} from "./onboarding-tracking";

describe("resolveOnboardingStepFromLocation", () => {
  it("maps intro, body questions, account and gym query params", () => {
    expect(resolveOnboardingStepFromLocation("/onboarding", "")).toBe(
      OnboardingSteps.INTRO,
    );
    expect(
      resolveOnboardingStepFromLocation("/onboarding", "?step=body&bodyQ=0"),
    ).toBe(OnboardingSteps.BODY_GENDER);
    expect(
      resolveOnboardingStepFromLocation("/onboarding", "?step=body&bodyQ=1"),
    ).toBe(OnboardingSteps.BODY_WEIGHT);
    expect(
      resolveOnboardingStepFromLocation("/onboarding", "?step=body&bodyQ=2"),
    ).toBe(OnboardingSteps.BODY_HEIGHT);
    expect(
      resolveOnboardingStepFromLocation("/onboarding", "?step=account"),
    ).toBe(OnboardingSteps.ACCOUNT_EMAIL);
    expect(resolveOnboardingStepFromLocation("/onboarding", "?step=gym")).toBe(
      OnboardingSteps.GYM_QUESTION,
    );
    expect(
      resolveOnboardingStepFromLocation(
        "/onboarding",
        "?step=gym-permissions",
      ),
    ).toBe(OnboardingSteps.GYM_PERMISSIONS);
    expect(
      resolveOnboardingStepFromLocation("/onboarding", "?step=gym-wait"),
    ).toBe(OnboardingSteps.GYM_WAIT);
    expect(resolveOnboardingStepFromLocation("/auth", "")).toBe(
      OnboardingSteps.ACCOUNT_EMAIL,
    );
    expect(resolveOnboardingStepFromLocation("/home", "")).toBeNull();
  });
});

describe("body and gym step helpers", () => {
  it("maps bodyQ and gym substeps", () => {
    expect(bodyStepFromQuestion(0)).toBe(OnboardingSteps.BODY_GENDER);
    expect(bodyStepFromQuestion(1)).toBe(OnboardingSteps.BODY_WEIGHT);
    expect(bodyStepFromQuestion(2)).toBe(OnboardingSteps.BODY_HEIGHT);
    expect(gymStepFromSubStep("question")).toBe(OnboardingSteps.GYM_QUESTION);
    expect(gymStepFromSubStep("search")).toBe(OnboardingSteps.GYM_SEARCH);
  });
});
