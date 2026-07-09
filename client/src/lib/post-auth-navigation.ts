import { fetchTrackedExercises } from "@/lib/data-api";
import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import {
  isOnboardingGymPending,
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

/** Après auth, envoie vers le tour premier exercice si le compte n'a rien de suivi. */
export async function resolvePostAuthNavigation(
  nextPath: string,
): Promise<string> {
  if (nextPath !== "/home") {
    return nextPath;
  }

  if (isOnboardingGymPending()) {
    return "/home";
  }

  try {
    const tracked = await fetchTrackedExercises();
    if (hasVisibleTrackedExercise(tracked)) {
      setOnboardingFirstExercisePending(false);
      setOnboardingTourComplete(true);
      return "/home";
    }
    setOnboardingFirstExercisePending(true);
    return "/exercises?tour=onboarding-first";
  } catch {
    return nextPath;
  }
}
