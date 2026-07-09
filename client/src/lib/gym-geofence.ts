import { Capacitor } from "@capacitor/core";
import { GymGeofence } from "gym-geofence";
import { UI } from "@/lib/translations";

export type GymGeofenceRegisterOptions = {
  lat: number;
  lng: number;
  radiusM: number;
  gymName: string;
  onboardingGymPending?: boolean;
};

export const GYM_GEOFENCE_NOTIFICATION_ID = 43;
export const GYM_GEOFENCE_COOLDOWN_MS = 4 * 60 * 60 * 1000;

function buildNotificationBody(gymName: string, onboardingGymPending: boolean): string {
  if (onboardingGymPending) {
    return UI.gymGeofenceEnterBody.replace("{name}", gymName);
  }
  return UI.gymGeofenceEnterBodyGeneric;
}

export async function registerGymGeofence(
  options: GymGeofenceRegisterOptions,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const deepLinkRoute = options.onboardingGymPending
    ? "/exercises?tour=onboarding-first"
    : "/home";

  await GymGeofence.register({
    lat: options.lat,
    lng: options.lng,
    radiusM: options.radiusM,
    identifier: "one-more-home-gym",
    notificationTitle: UI.gymGeofenceEnterTitle,
    notificationBody: buildNotificationBody(
      options.gymName,
      options.onboardingGymPending ?? false,
    ),
    deepLinkRoute,
  });
}

export async function unregisterGymGeofence(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await GymGeofence.unregister();
}

export function navigateToRoute(route: string) {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  window.location.hash = `#${normalized}`;
}
