import { useAuth } from "@/hooks/use-auth";
import { useUserProfileData } from "@/hooks/use-api-data";
import { usePaywall } from "@/hooks/use-paywall";
import {
  isPurchasesAvailable,
  logOutPurchases,
  restorePurchases,
  syncPurchasesAfterLogin,
  type RevenueCatSubscriberInfo,
} from "@/lib/purchases";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function usePurchases() {
  const auth = useAuth();
  const paywall = usePaywall();
  const { data: profile } = useUserProfileData();
  const [available] = useState(isPurchasesAvailable);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated" || !auth.user?.id) return;
    const subscriberInfo: RevenueCatSubscriberInfo = {
      userId: auth.user.id,
      email: auth.user.email,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      username: profile?.username ?? null,
      gender: profile?.gender ?? null,
      weightKg: profile?.weightKg ?? null,
      heightCm: profile?.heightCm ?? null,
    };
    void syncPurchasesAfterLogin(subscriberInfo.userId, subscriberInfo);
  }, [
    auth.status,
    auth.user?.id,
    auth.user?.email,
    profile?.firstName,
    profile?.lastName,
    profile?.username,
    profile?.gender,
    profile?.weightKg,
    profile?.heightCm,
  ]);

  useEffect(() => {
    if (auth.status === "authenticated") return;
    void logOutPurchases();
  }, [auth.status]);

  const subscribe = useCallback(
    async (source?: string) => {
      if (!available) return false;
      return paywall.openPaywall(source ?? "unknown");
    },
    [available, paywall],
  );

  const restore = useCallback(async () => {
    if (!available) return false;
    setRestoring(true);
    try {
      await restorePurchases();
      toast.success(UI.premiumRestoreSuccess);
      return true;
    } catch {
      toast.error(UI.premiumRestoreError);
      return false;
    } finally {
      setRestoring(false);
    }
  }, [available]);

  return {
    available,
    busy: restoring,
    subscribe,
    restore,
  };
}
