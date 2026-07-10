import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { fetchUserGym } from "@/lib/gyms-api";
import { useGymNotificationsReady } from "@/hooks/use-gym-notifications-ready";
import { isGymLocationPromptDone } from "@/lib/storage";
import { unlockGymAccess } from "@/lib/gym-onboarding";
import {
  GYM_GEOFENCE_DEEP_LINK_PARAM,
  GYM_GEOFENCE_NOTIFICATION_ID,
  navigateToRoute,
  registerGymGeofenceIfPermitted,
} from "@/lib/gym-geofence";
import { isGymOnboardingPendingFromApi } from "@/lib/gym-onboarding-route";

function parseGymGeofenceOpenUrl(url: string): {
  route: string;
  fromGymGeofence: boolean;
} | null {
  try {
    const parsed = new URL(url);
    const hash = parsed.hash.replace(/^#/, "");
    if (!hash.startsWith("/")) return null;

    const queryIndex = hash.indexOf("?");
    const path = queryIndex >= 0 ? hash.slice(0, queryIndex) : hash;
    const query = queryIndex >= 0 ? hash.slice(queryIndex + 1) : "";
    const params = new URLSearchParams(query);
    const fromGymGeofence = params.get(GYM_GEOFENCE_DEEP_LINK_PARAM) === "1";

    return { route: path, fromGymGeofence };
  } catch {
    return null;
  }
}

async function handleGymGeofenceOpenUrl(url: string): Promise<boolean> {
  const parsed = parseGymGeofenceOpenUrl(url);
  if (!parsed) return false;

  if (parsed.fromGymGeofence) {
    try {
      const gym = await fetchUserGym();
      if (isGymOnboardingPendingFromApi(gym)) {
        await unlockGymAccess();
      }
    } catch {
      /* API indisponible. */
    }
  }

  navigateToRoute(parsed.route);
  return true;
}

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

    void App.getLaunchUrl().then((result) => {
      if (!result?.url) return;
      void handleGymGeofenceOpenUrl(result.url);
    });

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
      void handleGymGeofenceOpenUrl(event.url);
    });

    return () => {
      void localHandle.then((h) => h.remove());
      void appUrlHandle.then((h) => h.remove());
    };
  }, []);
}
