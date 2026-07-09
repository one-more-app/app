import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { fetchUserGym } from "@/lib/gyms-api";
import { useGymNotificationsReady } from "@/hooks/use-gym-notifications-ready";
import { isGymLocationPromptDone } from "@/lib/storage";
import { unlockGymAccess } from "@/lib/gym-onboarding";
import {
  GYM_GEOFENCE_NOTIFICATION_ID,
  navigateToRoute,
  registerGymGeofenceIfPermitted,
} from "@/lib/gym-geofence";
import { isGymOnboardingPendingFromApi } from "@/lib/gym-onboarding-route";

export function useGymGeofenceSync() {
  const notificationsReady = useGymNotificationsReady();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!notificationsReady) return;
    if (!isGymLocationPromptDone()) return;

    void (async () => {
      try {
        const gym = await fetchUserGym();
        if (!gym || !gym.geofenceEnabled) return;
        await registerGymGeofenceIfPermitted({
          lat: gym.lat,
          lng: gym.lng,
          radiusM: gym.radiusM,
          gymName: gym.name,
          onboardingGymPending: gym.onboardingGymPending,
        });
      } catch {
        /* API ou permissions indisponibles. */
      }
    })();
  }, [notificationsReady]);
}

export function useGymGeofenceNotificationTap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const localHandle = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action) => {
        if (action.notification.id !== GYM_GEOFENCE_NOTIFICATION_ID) return;
        const route = action.notification.extra?.route;
        if (typeof route === "string" && route.length > 0) {
          void (async () => {
            try {
              const gym = await fetchUserGym();
              if (isGymOnboardingPendingFromApi(gym)) {
                await unlockGymAccess();
              }
            } catch {
              /* API indisponible. */
            }
            navigateToRoute(route);
          })();
        }
      },
    );

    const appUrlHandle = App.addListener("appUrlOpen", (event) => {
      try {
        const url = new URL(event.url);
        const hash = url.hash.replace(/^#/, "");
        if (hash.startsWith("/")) {
          navigateToRoute(hash);
        }
      } catch {
        /* URL invalide. */
      }
    });

    return () => {
      void localHandle.then((h) => h.remove());
      void appUrlHandle.then((h) => h.remove());
    };
  }, []);
}
