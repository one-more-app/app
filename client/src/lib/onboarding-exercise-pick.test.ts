import { describe, expect, it } from "vitest";
import {
  ONBOARDING_EXERCISE_PICK_PATH,
  isOnboardingExercisePickLocation,
  onboardingExerciseFromCatalog,
  onboardingExerciseFromDraft,
} from "./onboarding-exercise-pick";

describe("isOnboardingExercisePickLocation", () => {
  it("détecte le catalogue ouvert depuis le record onboarding", () => {
    expect(
      isOnboardingExercisePickLocation("/exercises", "?from=onboarding"),
    ).toBe(true);
    expect(isOnboardingExercisePickLocation("/exercises", "?from=onboarding&step=list")).toBe(
      true,
    );
    expect(isOnboardingExercisePickLocation("/exercises", "")).toBe(false);
    expect(
      isOnboardingExercisePickLocation("/onboarding", "?step=record"),
    ).toBe(false);
  });

  it("expose le chemin de départ", () => {
    expect(ONBOARDING_EXERCISE_PICK_PATH).toBe("/exercises?from=onboarding");
  });
});

describe("onboardingExerciseFromCatalog", () => {
  it("garde le nom API pour la ligue et traduit le sous-titre", () => {
    expect(
      onboardingExerciseFromCatalog({
        id: "abc123",
        name: "barbell bench press",
        nameFr: "Développé couché",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
        secondaryMuscles: [],
        instructions: [],
        gifUrl: "https://example.com/abc123.gif",
      }),
    ).toEqual({
      exerciseId: "abc123",
      name: "Développé couché",
      originalName: "barbell bench press",
      subtitle: "Pectoraux",
      bodyPart: "chest",
      target: "pectorals",
      equipment: "barbell",
      gifUrl: "https://example.com/abc123.gif",
    });
  });
});

describe("onboardingExerciseFromDraft", () => {
  it("reconstruit un exo hors liste starter", () => {
    expect(
      onboardingExerciseFromDraft({
        exerciseId: "custom-like",
        name: "Soulevé de terre",
        originalName: "barbell deadlift",
        bodyPart: "back",
        target: "lats",
        equipment: "barbell",
      }),
    ).toMatchObject({
      exerciseId: "custom-like",
      name: "Soulevé de terre",
      originalName: "barbell deadlift",
      subtitle: "Dorsaux",
    });
  });
});
