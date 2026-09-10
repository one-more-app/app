import {
  findOnboardingStarterExercise,
  onboardingTrackedId,
  resolveOnboardingExerciseGifUrl,
  type OnboardingStarterExercise,
} from "@/lib/onboarding-starter-exercises";
import {
  peekPendingOnboardingRecord,
  setPendingOnboardingRecord,
} from "@/lib/storage";
import { translateBodyPart, translateTarget } from "@/lib/translations";
import type { ExerciseDBExercise } from "@/types";

export const ONBOARDING_EXERCISE_PICK_FROM = "onboarding";
export const ONBOARDING_EXERCISE_PICK_PATH = `/exercises?from=${ONBOARDING_EXERCISE_PICK_FROM}`;

export function isOnboardingExercisePickLocation(
  pathname: string,
  search: string,
): boolean {
  if (pathname !== "/exercises") return false;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return params.get("from") === ONBOARDING_EXERCISE_PICK_FROM;
}

export function onboardingExerciseFromCatalog(
  exercise: ExerciseDBExercise,
): OnboardingStarterExercise {
  const name = exercise.nameFr?.trim() || exercise.name;
  return {
    exerciseId: exercise.id,
    name,
    originalName: exercise.name,
    subtitle: exercise.target
      ? translateTarget(exercise.target)
      : translateBodyPart(exercise.bodyPart),
    bodyPart: exercise.bodyPart,
    target: exercise.target,
    equipment: exercise.equipment,
    gifUrl: exercise.gifUrl,
  };
}

export function onboardingExerciseFromDraft(draft: {
  exerciseId: string;
  name: string;
  originalName: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl?: string;
}): OnboardingStarterExercise {
  return (
    findOnboardingStarterExercise(draft.exerciseId) ?? {
      exerciseId: draft.exerciseId,
      name: draft.name,
      originalName: draft.originalName,
      subtitle: draft.target
        ? translateTarget(draft.target)
        : translateBodyPart(draft.bodyPart),
      bodyPart: draft.bodyPart,
      target: draft.target,
      equipment: draft.equipment,
      gifUrl: draft.gifUrl,
    }
  );
}

export function persistOnboardingRecordDraft(
  exercise: OnboardingStarterExercise,
  weight: number,
  reps: number,
): void {
  const existing = peekPendingOnboardingRecord();
  setPendingOnboardingRecord({
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    originalName: exercise.originalName,
    bodyPart: exercise.bodyPart,
    target: exercise.target,
    equipment: exercise.equipment,
    gifUrl: resolveOnboardingExerciseGifUrl(exercise),
    weight,
    reps,
    clientTrackedId: onboardingTrackedId(exercise.exerciseId),
    clientPerfId:
      existing?.exerciseId === exercise.exerciseId
        ? existing.clientPerfId
        : crypto.randomUUID(),
  });
}

export type OnboardingRecordSelectionHydration = {
  exercise: OnboardingStarterExercise;
  weight: number;
  reps: number;
};

export function hydrateOnboardingRecordSelection(): OnboardingRecordSelectionHydration | null {
  const draft = peekPendingOnboardingRecord();
  if (!draft) return null;
  return {
    exercise: onboardingExerciseFromDraft(draft),
    weight: draft.weight,
    reps: draft.reps,
  };
}
