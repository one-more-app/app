import { useAuth } from "@/hooks/use-auth";
import { fetchUserAccess, type UserAccess, ACCESS_SWR_KEY } from "@/lib/social-api";
import { REFERRALS_FOR_TSHIRT_REWARD } from "@one-more/shared/access-config";
import useSWR from "swr";

export { ACCESS_SWR_KEY };

export function useAccess() {
  const auth = useAuth();
  const { data, error, isLoading, mutate } = useSWR<UserAccess>(
    auth.status === "authenticated" ? ACCESS_SWR_KEY : null,
    fetchUserAccess,
    { revalidateOnFocus: true },
  );

  return {
    access: data ?? null,
    isLoading,
    error,
    refresh: mutate,
    canAddExercise: data?.canAddExercise ?? true,
    exerciseLimit: data?.exerciseLimit ?? null,
    referralCount: data?.referralCount ?? 0,
    hasUsedReferralCode: data?.hasUsedReferralCode ?? false,
    isPremium: data?.isPremium ?? false,
    tshirtRewardEligible: data?.tshirtRewardEligible ?? false,
    referralsUntilTshirt: data?.referralsUntilTshirt ?? REFERRALS_FOR_TSHIRT_REWARD,
  };
}
