import { useAuth } from "@/hooks/use-auth";
import { useGymNotificationsReady } from "@/hooks/use-gym-notifications-ready";
import {
  attachPushNotificationListeners,
  registerPushIfPermitted,
} from "@/lib/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

export function usePushNotifications() {
  const auth = useAuth();
  const notificationsReady = useGymNotificationsReady();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;
    return attachPushNotificationListeners();
  }, [auth.status]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!notificationsReady) return;
    void registerPushIfPermitted();
  }, [notificationsReady]);
}
