import {
  clearOnboardingGymPendingApi,
  fetchUserGym,
} from "@/lib/gyms-api";
import {
  isGymOnboardingPendingFromApi,
  USER_GYM_SWR_KEY,
} from "@/lib/gym-onboarding-route";
import {
  markOnboardingDone,
  setOnboardingFirstExercisePending,
} from "@/lib/storage";
import { mutate } from "swr";

export async function unlockGymAccess(): Promise<void> {
  let gym: Awaited<ReturnType<typeof fetchUserGym>>;
  try {
    gym = await fetchUserGym();
  } catch {
    return;
  }
  if (!isGymOnboardingPendingFromApi(gym)) return;

  try {
    await clearOnboardingGymPendingApi();
    await mutate(USER_GYM_SWR_KEY);
  } catch {
    /* API indisponible. */
  }

  setOnboardingFirstExercisePending(true);
  markOnboardingDone();
}

export async function finalizeDeferredGymOnboarding(): Promise<void> {
  await unlockGymAccess();
}
