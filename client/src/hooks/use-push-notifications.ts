import { useAuth } from "@/hooks/use-auth";
import {
  attachPushNotificationListeners,
  registerPushNotifications,
} from "@/lib/push-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { pushDebug } from "@/lib/push-debug";
import { PushNotifications } from "@capacitor/push-notifications";
import { useEffect } from "react";

export function usePushNotifications() {
  const auth = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log("[push] usePushNotifications: skipped (not native)");
      return;
    }
    if (auth.status !== "authenticated") {
      console.log("[push] usePushNotifications: skipped (not authenticated)", {
        status: auth.status,
      });
      return;
    }

    console.log("[push] usePushNotifications: init", {
      platform: Capacitor.getPlatform(),
    });
    const detach = attachPushNotificationListeners();
    void registerPushNotifications();

    const appStateHandle = CapacitorApp.addListener(
      "appStateChange",
      ({ isActive }) => {
        console.log("[push] appStateChange", { isActive });
        pushDebug("use-push-notifications.ts:appState", "app state changed", {
          isActive,
        }, "H-C");
        if (!isActive) return;
        void PushNotifications.getDeliveredNotifications().then((res) => {
          console.log("[push] delivered notifications on resume", {
            count: res.notifications.length,
            notifications: res.notifications,
          });
          pushDebug("use-push-notifications.ts:delivered", "delivered on resume", {
            count: res.notifications.length,
            titles: res.notifications.map((n) => n.title ?? ""),
          }, "H-C");
        });
        void PushNotifications.checkPermissions().then((perm) => {
          pushDebug("use-push-notifications.ts:perm", "permission on resume", {
            receive: perm.receive,
          }, "H-D");
        });
      },
    );

    return () => {
      console.log("[push] usePushNotifications: cleanup");
      void appStateHandle.then((h) => h.remove());
      detach();
    };
  }, [auth.status]);
}
