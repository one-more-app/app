import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { fetchUserGym } from "@/lib/gyms-api";
import {
  GYM_GEOFENCE_NOTIFICATION_ID,
  navigateToRoute,
  registerGymGeofence,
} from "@/lib/gym-geofence";
import { useAuth } from "@/hooks/use-auth";

export function useGymGeofenceSync() {
  const auth = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;

    void (async () => {
      try {
        const gym = await fetchUserGym();
        if (!gym || !gym.geofenceEnabled) return;
        await registerGymGeofence({
          lat: gym.lat,
          lng: gym.lng,
          radiusM: gym.radiusM,
          gymName: gym.name,
          onboardingGymPending: gym.onboardingGymPending,
        });
      } catch {
        /* API indisponible. */
      }
    })();
  }, [auth.status]);
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
          navigateToRoute(route);
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
