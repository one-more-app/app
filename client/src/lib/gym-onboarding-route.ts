import type { UserGym } from "@/lib/gyms-api";
import { needsGymPermissionsPrompt } from "@/lib/storage";

export const USER_GYM_SWR_KEY = "user-gym";

export type GymOnboardingStep = "gym" | "gym-permissions" | "gym-wait";

export function resolveGymOnboardingStep(
  gym: UserGym | null | undefined,
  options: { permissionsNative: boolean },
): GymOnboardingStep | null {
  if (!gym) return "gym";
  if (gym.onboardingGymPending) return "gym-wait";
  if (needsGymPermissionsPrompt(options.permissionsNative)) {
    return "gym-permissions";
  }
  return null;
}

export function gymOnboardingPath(step: GymOnboardingStep): string {
  return `/onboarding?step=${step}`;
}

export function isGymOnboardingPendingFromApi(
  gym: UserGym | null | undefined,
): boolean {
  return gym?.onboardingGymPending === true;
}
