import { clearOnboardingGymPendingApi } from "@/lib/gyms-api";
import {
  clearOnboardingGymPending,
  isOnboardingGymPending,
  markOnboardingDone,
} from "@/lib/storage";

export async function finalizeDeferredGymOnboarding(): Promise<void> {
  if (!isOnboardingGymPending()) return;
  clearOnboardingGymPending();
  markOnboardingDone();
  try {
    await clearOnboardingGymPendingApi();
  } catch {
    /* API indisponible. */
  }
}
