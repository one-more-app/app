import { useAuth } from "@/hooks/use-auth";
import {
  isPurchasesAvailable,
  logOutPurchases,
  presentPaywall,
  restorePurchases,
  syncPurchasesAfterLogin,
} from "@/lib/purchases";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function usePurchases() {
  const auth = useAuth();
  const [available, setAvailable] = useState(isPurchasesAvailable());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAvailable(isPurchasesAvailable());
  }, []);

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
      setBusy(true);
      try {
        const success = await presentPaywall({ source });
        if (success) {
          toast.success(UI.premiumSubscribeSuccess);
        }
        return success;
      } catch {
        toast.error(UI.premiumSubscribeError);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [available],
  );

  const restore = useCallback(async () => {
    if (!available) return false;
    setBusy(true);
    try {
      await restorePurchases();
      toast.success(UI.premiumRestoreSuccess);
      return true;
    } catch {
      toast.error(UI.premiumRestoreError);
      return false;
    } finally {
      setBusy(false);
    }
  }, [available]);

  return {
    available,
    busy,
    subscribe,
    restore,
  };
}
