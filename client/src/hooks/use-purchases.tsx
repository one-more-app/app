import { useAuth } from "@/hooks/use-auth";
import {
  isPurchasesAvailable,
  logOutPurchases,
  presentPaywall,
  restorePurchases,
  syncPurchasesAfterLogin,
} from "@/lib/purchases";
import { useCallback, useEffect, useState } from "react";

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

  const subscribe = useCallback(async () => {
    if (!available) return false;
    setBusy(true);
    try {
      return await presentPaywall();
    } finally {
      setBusy(false);
    }
  }, [available]);

  const restore = useCallback(async () => {
    if (!available) return;
    setBusy(true);
    try {
      await restorePurchases();
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
