import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  beginOnboardingDraftSession,
  clearOnboardingDraftsAndSession,
  discardPendingOnboardingDrafts,
  peekPendingOnboardingProfile,
  peekPendingOnboardingRecord,
  setPendingOnboardingProfile,
  setPendingOnboardingRecord,
  type PendingOnboardingRecord,
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

const record: PendingOnboardingRecord = {
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

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: memoryStorage(),
    configurable: true,
  });
});

afterEach(() => {
  clearOnboardingDraftsAndSession();
});

describe("onboarding draft session", () => {
  it("n'expose pas un leftover sans session courante", () => {
    localStorage.setItem(
      "one-more-pending-onboarding-record-v1",
      JSON.stringify({ ...record, sessionId: "stale-session" }),
    );

    expect(peekPendingOnboardingRecord()).toBeNull();
  });

  it("n'expose que le draft du parcours en cours", () => {
    beginOnboardingDraftSession();
    setPendingOnboardingRecord(record);

    const current = peekPendingOnboardingRecord();
    expect(current?.exerciseId).toBe(record.exerciseId);
    expect(current?.weight).toBe(60);

    beginOnboardingDraftSession();
    expect(peekPendingOnboardingRecord()).toBeNull();
  });

  it("ignore un leftover morpho d'une autre visite", () => {
    localStorage.setItem(
      "one-more-pending-onboarding-profile-v1",
      JSON.stringify({
        weightKg: 90,
        heightCm: 190,
        gender: "male",
        sessionId: "other-visit",
      }),
    );

    expect(peekPendingOnboardingProfile()).toBeNull();

    beginOnboardingDraftSession();
    setPendingOnboardingProfile({
      weightKg: 75,
      heightCm: 175,
      gender: "female",
    });
    expect(peekPendingOnboardingProfile()).toEqual({
      weightKg: 75,
      heightCm: 175,
      gender: "female",
      sessionId: expect.any(String),
    });
  });

  it("jette les drafts sur « j'ai un compte »", () => {
    beginOnboardingDraftSession();
    setPendingOnboardingRecord(record);
    localStorage.setItem(
      "one-more-pending-onboarding-exercise-pick-v1",
      JSON.stringify({
        exerciseId: "abc123",
        name: "Soulevé de terre",
        originalName: "barbell deadlift",
        subtitle: "Dos",
        bodyPart: "back",
        target: "lats",
        equipment: "barbell",
        sessionId: sessionStorage.getItem("one-more-onboarding-draft-session-v1"),
      }),
    );
    discardPendingOnboardingDrafts();
    expect(peekPendingOnboardingRecord()).toBeNull();
    expect(
      localStorage.getItem("one-more-pending-onboarding-exercise-pick-v1"),
    ).toBeNull();
  });
});
