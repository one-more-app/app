import {
  resolveGymOnboardingStep,
  USER_GYM_SWR_KEY,
} from "@/lib/gym-onboarding-route";
import { fetchUserGym } from "@/lib/gyms-api";
import { useAuth } from "@/hooks/use-auth";
import { needsOnboarding } from "@/lib/storage";
import { Capacitor } from "@capacitor/core";
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";

export { USER_GYM_SWR_KEY };

export function useUserGymData() {
  const auth = useAuth();
  return useSWR(
    auth.status === "authenticated" ? USER_GYM_SWR_KEY : null,
    fetchUserGym,
  );
}

export function useMutateUserGym() {
  const { mutate } = useSWRConfig();
  return useCallback(async () => {
    await mutate(USER_GYM_SWR_KEY);
  }, [mutate]);
}

/** Bloque repos / notifs tant que le parcours salle n'est pas terminé côté API. */
export function useGymOnboardingBlocksFeatures(): boolean {
  const auth = useAuth();
  const { data: userGym, isLoading } = useUserGymData();

  if (needsOnboarding()) return true;
  if (auth.status !== "authenticated") return false;
  if (isLoading) return false;

  return (
    resolveGymOnboardingStep(userGym ?? null, {
      permissionsNative: Capacitor.isNativePlatform(),
    }) !== null
  );
}
