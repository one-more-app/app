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
  clearOnboardingRecordDestination,
  isFirstSessionFlowDone,
  isNotificationsEduDone,
  isNotificationsRepromptDone,
  isOnboardingFirstExercisePending,
  markOnboardingDone,
  peekPostAuthFlowDestination,
  setOnboardingFirstExercisePending,
  setOnboardingTourComplete,
  setFirstSessionFlowDone,
  setPostAuthFlowDestination,
  setNotificationsEduDone,
  setNotificationsRepromptDone,
} from "@/lib/storage";
import { Capacitor } from "@capacitor/core";

export const ONBOARDING_DISCOVERY_PATH = "/onboarding?step=discovery";
export const ONBOARDING_NOTIFICATIONS_PATH =
  "/onboarding?step=notifications";
/** Relance après la 1ʳᵉ séance (plus dans le post-auth). */
export const ONBOARDING_NOTIFICATIONS_REPROMPT_PATH =
  "/onboarding?step=notifications&from=reprompt";
export const ONBOARDING_FIRST_SESSION_PATH = "/onboarding?step=first-session";
export const ONBOARDING_FIRST_REMINDER_PATH = "/onboarding?step=first-reminder";
export const ONBOARDING_FIRST_DAYS_PATH = "/onboarding?step=first-days";
export const ONBOARDING_FIRST_NOTED_PATH = "/onboarding?step=first-noted";
export const ONBOARDING_FIRST_NOTED_GYM_PATH =
  "/onboarding?step=first-noted&mode=gym";
/** Choix « En arrivant à la salle » : recherche de salle existante. */
export const ONBOARDING_FIRST_SESSION_GYM_PATH =
  "/onboarding?step=gym&reselect=1&from=first-session";
export const ONBOARDING_FIRST_SESSION_GYM_PERMISSIONS_PATH =
  "/onboarding?step=gym-permissions&reselect=1&from=first-session";

/** Affiche encore l'écran Notifications (relance post-1ʳᵉ séance). */
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

export function isOnboardingFirstSessionPath(path: string): boolean {
  return (
    path.startsWith("/onboarding") &&
    (path.includes("step=first-session") ||
      path.includes("step=first-reminder") ||
      path.includes("step=first-days") ||
      path.includes("step=first-noted"))
  );
}

export function isPostAuthOnboardingFlowPath(path: string): boolean {
  return (
    isOnboardingDiscoveryPath(path) ||
    isOnboardingNotificationsPath(path) ||
    isOnboardingFirstSessionPath(path)
  );
}

/**
 * Parcours « Ta première séance » : nouvel utilisateur sans exercice suivi
 * (destination post-auth = catalogue, premier exercice en attente) qui ne l'a
 * pas encore terminé. Les utilisateurs avec historique ne le voient jamais.
 */
export function shouldShowFirstSessionFlow(destination: string | null): boolean {
  if (isFirstSessionFlowDone()) return false;
  return destination === "/exercises" && isOnboardingFirstExercisePending();
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
  // Plus d'atterrissage fiche exo après record pré-inscription.
  clearOnboardingRecordDestination();

  if (nextPath !== "/home" && nextPath !== "/exercises") return nextPath;

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
    const hasTracked = hasVisibleTrackedExercise(tracked);
    // Déjà passé par « Ta première séance » (ou historique) → accueil.
    if (
      hasTracked &&
      (isFirstSessionFlowDone() || !isOnboardingFirstExercisePending())
    ) {
      setOnboardingFirstExercisePending(false);
      setOnboardingTourComplete(true);
      return "/home";
    }
    // Record pré-inscription ou aucun exo : pending + first-session.
    setOnboardingFirstExercisePending(true);
    return "/exercises";
  } catch {
    if (isOnboardingFirstExercisePending()) return "/exercises";
    return nextPath === "/exercises" ? "/exercises" : nextPath;
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

/** Relance Notifications après la 1ʳᵉ séance (plus au post-auth). */
export async function shouldShowNotificationsReprompt(): Promise<boolean> {
  if (!ONBOARDING_NOTIFICATIONS_STEP_ENABLED) return false;
  if (isNotificationsRepromptDone()) return false;
  if (await isPushPermissionGranted()) return false;
  if (!Capacitor.isNativePlatform()) {
    return !isNotificationsEduDone();
  }
  return true;
}

/** @deprecated Plus utilisé au post-auth ; conservé pour tests / compat. */
export async function shouldShowOnboardingNotificationsPrompt(): Promise<boolean> {
  return false;
}

/** Après auth : discovery puis first-session (pas de Notifications). */
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
  if (shouldShowFirstSessionFlow(destination)) {
    return ONBOARDING_FIRST_SESSION_PATH;
  }

  markOnboardingDone(destination);
  return destination;
}

/** Après Discovery : first-session si besoin, sinon destination. */
export async function continueAfterOnboardingDiscovery(): Promise<string> {
  return continueAfterOnboardingNotifications();
}

/**
 * Fin éducation / relance Notifications, ou suite post-discovery.
 * Ne réaffiche plus Notifications au post-auth.
 */
export function continueAfterOnboardingNotifications(): string {
  if (!Capacitor.isNativePlatform()) {
    setNotificationsEduDone(true);
  }
  const destination = peekPostAuthFlowDestination() ?? "/home";
  if (shouldShowFirstSessionFlow(destination)) {
    return ONBOARDING_FIRST_SESSION_PATH;
  }
  markOnboardingDone(destination);
  return destination;
}

/** Fin de la relance Notifications après 1ʳᵉ séance. */
export function finishNotificationsReprompt(): void {
  setNotificationsRepromptDone(true);
  if (!Capacitor.isNativePlatform()) {
    setNotificationsEduDone(true);
  }
}

/**
 * Fin du parcours « Ta première séance » : mémorise qu'il est fait puis
 * termine l'onboarding. `exercises` ouvre le catalogue (premier exercice).
 */
export function finishFirstSessionFlow(to: "exercises" | "home"): string {
  setFirstSessionFlowDone(true);
  const destination = to === "home" ? "/home" : "/exercises";
  markOnboardingDone(destination);
  return destination;
}

/** Choix salle : la suite passe par le flux salle existant, confirm ensuite. */
export function leaveFirstSessionFlowForGym(): string {
  return ONBOARDING_FIRST_SESSION_GYM_PATH;
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
