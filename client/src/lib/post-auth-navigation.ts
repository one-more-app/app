import { commitPendingOnboardingRecord } from "@/lib/onboarding-record";
import { fetchTrackedExercises, fetchRemoteProfile } from "@/lib/data-api";
import { fetchUserGym } from "@/lib/gyms-api";
import {
  gymOnboardingPath,
  isGymOnboardingBypassed,
} from "@/lib/gym-onboarding-route";
import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import { isPushPermissionGranted } from "@/lib/push-notifications";
import {
  isNotificationsEduDone,
  markOnboardingDone,
  peekOnboardingRecordDestination,
  peekPostAuthFlowDestination,
  setOnboardingFirstExercisePending,
  setOnboardingTourComplete,
  setPostAuthFlowDestination,
  setNotificationsEduDone,
} from "@/lib/storage";
import { Capacitor } from "@capacitor/core";

export const ONBOARDING_DISCOVERY_PATH = "/onboarding?step=discovery";
export const ONBOARDING_NOTIFICATIONS_PATH =
  "/onboarding?step=notifications";

/** Masque temporairement l'écran push post-auth. Remettre à true pour réactiver. */
export const ONBOARDING_NOTIFICATIONS_STEP_ENABLED = true;

export type ResolvePostAuthNavigationOptions = {
  isNewUser?: boolean;
};

export function isOnboardingDiscoveryPath(path: string): boolean {
  return path.startsWith("/onboarding") && path.includes("step=discovery");
}

export function isOnboardingNotificationsPath(path: string): boolean {
  return (
    path.startsWith("/onboarding") && path.includes("step=notifications")
  );
}

export function isPostAuthOnboardingFlowPath(path: string): boolean {
  return (
    isOnboardingDiscoveryPath(path) || isOnboardingNotificationsPath(path)
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

async function resolveFinalPostAuthDestination(
  nextPath: string,
): Promise<string> {
  const recordDestination = peekOnboardingRecordDestination();
  if (recordDestination) return recordDestination;

  if (nextPath !== "/home") return nextPath;

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

async function shouldShowDiscoveryPrompt(
  isNewUser: boolean,
): Promise<boolean> {
  if (!isNewUser) return false;
  try {
    const profile = await fetchRemoteProfile();
    if (profile?.discoverySource) return false;
    return true;
  } catch {
    return true;
  }
}

export async function shouldShowOnboardingNotificationsPrompt(): Promise<boolean> {
  if (!ONBOARDING_NOTIFICATIONS_STEP_ENABLED) return false;
  if (await isPushPermissionGranted()) return false;
  if (!Capacitor.isNativePlatform()) {
    return !isNotificationsEduDone();
  }
  return true;
}

/** Après auth, envoie vers discovery / notifs / destination finale. */
export async function resolvePostAuthNavigation(
  nextPath: string,
  options?: ResolvePostAuthNavigationOptions,
): Promise<string> {
  await commitPendingOnboardingRecord();
  const destination = await resolveFinalPostAuthDestination(nextPath);
  setPostAuthFlowDestination(destination);

  if (await shouldShowDiscoveryPrompt(options?.isNewUser === true)) {
    return ONBOARDING_DISCOVERY_PATH;
  }
  if (await shouldShowOnboardingNotificationsPrompt()) {
    return ONBOARDING_NOTIFICATIONS_PATH;
  }

  markOnboardingDone(destination);
  return destination;
}

/** Après l'écran discovery : notifs si besoin, sinon destination. */
export async function continueAfterOnboardingDiscovery(): Promise<string> {
  if (await shouldShowOnboardingNotificationsPrompt()) {
    return ONBOARDING_NOTIFICATIONS_PATH;
  }
  return continueAfterOnboardingNotifications();
}

/** Après l'écran notifications : termine l'onboarding et ouvre la destination. */
export function continueAfterOnboardingNotifications(): string {
  if (!Capacitor.isNativePlatform()) {
    setNotificationsEduDone(true);
  }
  const destination = peekPostAuthFlowDestination() ?? "/home";
  markOnboardingDone(destination);
  return destination;
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
