import { useAuth } from "@/hooks/use-auth";
import { usePaywall } from "@/hooks/use-paywall";
import {
  isPurchasesAvailable,
  logOutPurchases,
  restorePurchases,
  syncPurchasesAfterLogin,
} from "@/lib/purchases";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function usePurchases() {
  const auth = useAuth();
  const paywall = usePaywall();
  const [available] = useState(isPurchasesAvailable);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated" || !auth.user?.id) return;
    void syncPurchasesAfterLogin(auth.user.id);
  }, [auth.status, auth.user?.id]);

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
