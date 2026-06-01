import { useAuth } from "@/hooks/use-auth";
import { fetchUserAccess, type UserAccess, ACCESS_SWR_KEY } from "@/lib/social-api";
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
    isLimited: data?.accessTier === "limited",
    canAddExercise: data?.canAddExercise ?? true,
  };
}
