import { Capacitor } from "@capacitor/core";
import { GymGeofence } from "gym-geofence";
import { UI } from "@/lib/translations";

export type GymGeofencePermissionResult = {
  ready: boolean;
  location: "granted" | "denied" | "prompt";
  backgroundLocation: "granted" | "denied" | "prompt";
  needsSettings: boolean;
};

export type GymGeofenceRegisterOptions = {
  lat: number;
  lng: number;
  radiusM: number;
  gymName: string;
  onboardingGymPending?: boolean;
};

export const GYM_GEOFENCE_NOTIFICATION_ID = 43;
export const GYM_GEOFENCE_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export class GymGeofencePermissionError extends Error {
  readonly needsSettings: boolean;

  constructor(needsSettings: boolean) {
    super("GYM_GEOFENCE_PERMISSIONS_DENIED");
    this.name = "GymGeofencePermissionError";
    this.needsSettings = needsSettings;
  }
}

const deniedPermissions: GymGeofencePermissionResult = {
  ready: false,
  location: "denied",
  backgroundLocation: "denied",
  needsSettings: false,
};

function buildNotificationBody(
  gymName: string,
  onboardingGymPending: boolean,
): string {
  if (onboardingGymPending) {
    return UI.gymGeofenceEnterBody.replace("{name}", gymName);
  }
  return UI.gymGeofenceEnterBodyGeneric;
}

export async function getGymGeofencePermissions(): Promise<GymGeofencePermissionResult> {
  if (!Capacitor.isNativePlatform()) return deniedPermissions;
  return GymGeofence.checkPermissions();
}

export async function requestGymGeofencePermissions(): Promise<GymGeofencePermissionResult> {
  if (!Capacitor.isNativePlatform()) return deniedPermissions;
  return GymGeofence.requestPermissions();
}

export async function ensureGymGeofencePermissions(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  let status = await getGymGeofencePermissions();
  if (!status.ready) {
    status = await requestGymGeofencePermissions();
  }
  if (!status.ready) {
    throw new GymGeofencePermissionError(status.needsSettings);
  }
}

export async function openGymGeofenceSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await GymGeofence.openSettings();
}

async function registerGymGeofenceNative(
  options: GymGeofenceRegisterOptions,
): Promise<void> {
  const deepLinkRoute = options.onboardingGymPending
    ? "/exercises"
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

export async function registerGymGeofenceIfPermitted(
  options: GymGeofenceRegisterOptions,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const status = await getGymGeofencePermissions();
  if (!status.ready) return false;
  await registerGymGeofenceNative(options);
  return true;
}

export async function registerGymGeofence(
  options: GymGeofenceRegisterOptions,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await ensureGymGeofencePermissions();
  await registerGymGeofenceNative(options);
}

export async function unregisterGymGeofence(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await GymGeofence.unregister();
}

export function navigateToRoute(route: string) {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  window.location.hash = `#${normalized}`;
}
