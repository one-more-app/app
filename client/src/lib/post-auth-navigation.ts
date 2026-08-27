import { commitPendingOnboardingRecord } from "@/lib/onboarding-record";
import { fetchTrackedExercises } from "@/lib/data-api";
import { fetchUserGym } from "@/lib/gyms-api";
import {
  gymOnboardingPath,
  isGymOnboardingBypassed,
} from "@/lib/gym-onboarding-route";
import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import { isPushPermissionGranted } from "@/lib/push-notifications";
import {
  isOnboardingNotificationsPromptDone,
  markOnboardingDone,
  peekOnboardingRecordDestination,
  setOnboardingFirstExercisePending,
  setOnboardingNotificationsPromptDone,
  setOnboardingTourComplete,
} from "@/lib/storage";

export const ONBOARDING_NOTIFICATIONS_PATH =
  "/onboarding?step=notifications";

/** Masque temporairement l'écran jours/heure + push. Remettre à true pour réactiver. */
export const ONBOARDING_NOTIFICATIONS_STEP_ENABLED = false;

export function isOnboardingNotificationsPath(path: string): boolean {
  return (
    path.startsWith("/onboarding") && path.includes("step=notifications")
  );
}

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
    if (await shouldShowOnboardingNotificationsPrompt()) {
      return ONBOARDING_NOTIFICATIONS_PATH;
    }
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

/** Landing fiche exo : retour accueil, pas l'écran compte. */
export function postAuthNavigateOptions(path: string): {
  replace: true;
  state?: { fromAddExercise: true };
} {
  if (path.startsWith("/exercise/")) {
    return { replace: true, state: { fromAddExercise: true } };
  }
  return { replace: true };
}

async function shouldShowOnboardingNotificationsPrompt(): Promise<boolean> {
  if (!ONBOARDING_NOTIFICATIONS_STEP_ENABLED) return false;
  if (!isGymOnboardingBypassed()) return false;
  if (isOnboardingNotificationsPromptDone()) return false;
  if (await isPushPermissionGranted()) {
    setOnboardingNotificationsPromptDone(true);
    return false;
  }
  return true;
}

/** Après l'écran notifications : termine l'onboarding et ouvre la fiche record. */
export function continueAfterOnboardingNotifications(): string {
  setOnboardingNotificationsPromptDone(true);
  const destination = peekOnboardingRecordDestination() ?? "/home";
  markOnboardingDone(destination);
  return destination;
}
