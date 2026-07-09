import { Capacitor } from "@capacitor/core";
import {
  getGymOnboardingContext,
  setGymOnboardingContext,
  setOnboardingGymPending,
} from "@/lib/storage";

const GYM_DEV_STEPS = new Set([
  "gym",
  "gym-permissions",
  "gym-wait",
  "gym-notifications",
  "gym-location",
]);

const DEV_GYM_NAME = "Basic Fit Dev";

/** Choix / changement de salle depuis les paramètres (legacy URL). */
export function isOnboardingGymFromSettings(
  step: string | null | undefined,
  from: string | null | undefined,
): boolean {
  return step === "gym" && from === "settings";
}

/** Retour volontaire à l'étape choix salle pendant l'onboarding salle. */
export function isGymReselectOnboarding(
  step: string | null | undefined,
  reselect: string | null | undefined,
): boolean {
  return step === "gym" && reselect === "1";
}

/** Prévisualisation des étapes salle en `vite dev` (web local). */
export function isOnboardingGymDevPreview(
  step: string | null | undefined,
): boolean {
  if (!import.meta.env.DEV || !step) return false;
  return GYM_DEV_STEPS.has(step);
}

/** Contexte « natif » pour permissions (affiche localisation + garde-fous). */
export function isGymPermissionsNativeContext(
  step: string | null | undefined,
): boolean {
  return Capacitor.isNativePlatform() || isOnboardingGymDevPreview(step);
}

/** Web local en dev : toggles permissions sans APIs Capacitor. */
export function isGymPermissionsDevWebPreview(): boolean {
  return import.meta.env.DEV && !Capacitor.isNativePlatform();
}

export function seedOnboardingGymDevState(step: string): void {
  if (!import.meta.env.DEV) return;
  if (step !== "gym-permissions" && step !== "gym-wait") return;
  if (!getGymOnboardingContext()) {
    setGymOnboardingContext(false, DEV_GYM_NAME);
  }
  if (step === "gym-wait") {
    setOnboardingGymPending(true);
  }
}
