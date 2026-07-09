import { fetchTrackedExercises } from "@/lib/data-api";
import { fetchUserGym } from "@/lib/gyms-api";
import { gymOnboardingPath } from "@/lib/gym-onboarding-route";
import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import {
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

  try {
    const gym = await fetchUserGym();
    if (gym?.onboardingGymPending) {
      return gymOnboardingPath("gym-wait");
    }
  } catch {
    /* On continue vers le parcours exercices. */
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
