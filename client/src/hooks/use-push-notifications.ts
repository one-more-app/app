import { useAuth } from "@/hooks/use-auth";
import {
  attachPushNotificationListeners,
  registerPushNotifications,
} from "@/lib/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

export function usePushNotifications() {
  const auth = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;

    const detach = attachPushNotificationListeners();
    void registerPushNotifications();

    return detach;
  }, [auth.status]);
}
