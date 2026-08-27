import { describe, expect, it } from "vitest";
import { trackedExerciseFromOnboardingDraft } from "./onboarding-record";
import type { PendingOnboardingRecord } from "./storage";

const draft: PendingOnboardingRecord = {
  exerciseId: "EIeI8Vf",
  name: "Développé couché",
  originalName: "barbell bench press",
  bodyPart: "chest",
  target: "pectorals",
  equipment: "barbell",
  weight: 60,
  reps: 5,
  clientTrackedId: "api-EIeI8Vf",
  clientPerfId: "perf-1",
};

describe("trackedExerciseFromOnboardingDraft", () => {
  it("lie le record au catalogue au lieu d'un exo personnalisé", () => {
    const tracked = trackedExerciseFromOnboardingDraft(draft);

    expect(tracked.isCustom).toBe(false);
    expect(tracked.id).toBe("api-EIeI8Vf");
    expect(tracked.exerciseId).toBe("EIeI8Vf");
    expect(tracked.name).toBe("barbell bench press");
    expect(tracked.originalName).toBe("barbell bench press");
    expect(tracked.gifUrl).toBe("https://static.exercisedb.dev/media/EIeI8Vf.gif");
  });

  it("conserve le gifUrl du draft s'il est déjà présent", () => {
    const tracked = trackedExerciseFromOnboardingDraft({
      ...draft,
      gifUrl: "https://static.exercisedb.dev/media/catalog.gif",
    });

    expect(tracked.gifUrl).toBe(
      "https://static.exercisedb.dev/media/catalog.gif",
    );
    expect(tracked.isCustom).toBe(false);
  });
});
