import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ONBOARDING_EXERCISE_PICK_PATH,
  hydrateOnboardingRecordSelection,
  isOnboardingExercisePickLocation,
  onboardingExerciseFromCatalog,
  onboardingExerciseFromDraft,
} from "./onboarding-exercise-pick";
import {
  beginOnboardingDraftSession,
  clearOnboardingDraftsAndSession,
  setPendingOnboardingExercisePick,
  setPendingOnboardingRecord,
} from "./storage";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  };
}

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

describe("hydrateOnboardingRecordSelection", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: memoryStorage(),
      configurable: true,
    });
    beginOnboardingDraftSession();
  });

  afterEach(() => {
    clearOnboardingDraftsAndSession();
  });

  it("garde le nouvel exo du catalogue après un second hydrate (Strict Mode)", () => {
    setPendingOnboardingRecord({
      exerciseId: "EIeI8Vf",
      name: "Développé couché",
      originalName: "barbell bench press",
      bodyPart: "chest",
      target: "pectorals",
      equipment: "barbell",
      weight: 60,
      reps: 5,
      clientTrackedId: "api-EIeI8Vf",
      clientPerfId: "perf-old",
    });
    setPendingOnboardingExercisePick({
      exerciseId: "catalog-squat",
      name: "Squat",
      originalName: "barbell squat",
      subtitle: "Quadriceps",
      bodyPart: "upper legs",
      target: "quads",
      equipment: "barbell",
      gifUrl: "https://example.com/squat.gif",
    });

    const first = hydrateOnboardingRecordSelection();
    expect(first?.fromPick).toBe(true);
    expect(first?.exercise.exerciseId).toBe("catalog-squat");

    const second = hydrateOnboardingRecordSelection();
    expect(second?.fromPick).toBe(false);
    expect(second?.exercise.exerciseId).toBe("catalog-squat");
    expect(second?.exercise.name).toBe("Squat");
  });
});
