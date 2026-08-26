import { commitPendingOnboardingRecord } from "@/lib/onboarding-record";
import { fetchTrackedExercises } from "@/lib/data-api";
import { fetchUserGym } from "@/lib/gyms-api";
import {
  gymOnboardingPath,
  isGymOnboardingBypassed,
} from "@/lib/gym-onboarding-route";
import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import {
  markOnboardingDone,
  peekOnboardingRecordDestination,
  setOnboardingFirstExercisePending,
  setOnboardingTourComplete,
} from "@/lib/storage";

export function hasVisibleTrackedExercise(
  tracked: Awaited<ReturnType<typeof fetchTrackedExercises>>,
): boolean {
  return tracked.some(
    (exercise) =>
      (exercise.bodyPart ?? exercise.target) !== "cardio" &&
      !(exercise.equipment && CARDIO_EQUIPMENT.has(exercise.equipment)),
  );
}

/** Après auth, envoie vers la fiche du record d'onboarding, sinon le tour premier exercice. */
export async function resolvePostAuthNavigation(
  nextPath: string,
): Promise<string> {
  await commitPendingOnboardingRecord();
  const recordDestination = peekOnboardingRecordDestination();
  if (recordDestination) {
    markOnboardingDone(recordDestination);
    return recordDestination;
  }

  if (nextPath !== "/home") {
    return nextPath;
  }

  if (!isGymOnboardingBypassed()) {
    try {
      const gym = await fetchUserGym();
      if (gym?.onboardingGymPending) {
        return gymOnboardingPath("gym-wait");
      }
    } catch {
      /* On continue vers le parcours exercices. */
    }
  }

  try {
    const tracked = await fetchTrackedExercises();
    if (hasVisibleTrackedExercise(tracked)) {
      setOnboardingFirstExercisePending(false);
      setOnboardingTourComplete(true);
      return "/home";
    }
    setOnboardingFirstExercisePending(true);
    return "/exercises";
  } catch {
    return nextPath;
  }
}
