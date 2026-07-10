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

export const GYM_GEOFENCE_DEEP_LINK_PARAM = "gymGeofence";

export function buildGymGeofenceDeepLinkRoute(baseRoute: string): string {
  const separator = baseRoute.includes("?") ? "&" : "?";
  return `${baseRoute}${separator}${GYM_GEOFENCE_DEEP_LINK_PARAM}=1`;
}

export async function getGymGeofencePermissions(): Promise<GymGeofencePermissionResult> {
  if (!Capacitor.isNativePlatform()) return deniedPermissions;
  return GymGeofence.checkPermissions();
}

export async function requestGymGeofencePermissions(): Promise<GymGeofencePermissionResult> {
  if (!Capacitor.isNativePlatform()) return deniedPermissions;
  const current = await getGymGeofencePermissions();
  if (current.ready || current.needsSettings) return current;
  return GymGeofence.requestPermissions();
}

const GYM_GEOFENCE_PERMISSION_REQUEST_TIMEOUT_MS = 45_000;

export async function requestGymGeofencePermissionsWithTimeout(): Promise<GymGeofencePermissionResult> {
  if (!Capacitor.isNativePlatform()) return deniedPermissions;

  const current = await getGymGeofencePermissions();
  if (current.ready || current.needsSettings) return current;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      requestGymGeofencePermissions(),
      new Promise<GymGeofencePermissionResult>((resolve) => {
        timeoutId = setTimeout(() => {
          void getGymGeofencePermissions().then(resolve);
        }, GYM_GEOFENCE_PERMISSION_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export type GymGeofenceLocationPromptResult = {
  status: GymGeofencePermissionResult;
  openedSettings: boolean;
};

export async function promptGymGeofenceLocationAccess(options?: {
  preferSettings?: boolean;
}): Promise<GymGeofenceLocationPromptResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: deniedPermissions, openedSettings: false };
  }

  if (options?.preferSettings) {
    await openGymGeofenceSettings();
    return {
      status: await getGymGeofencePermissions(),
      openedSettings: true,
    };
  }

  const status = await requestGymGeofencePermissionsWithTimeout();
  return { status, openedSettings: false };
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
  const baseRoute = options.onboardingGymPending ? "/exercises" : "/home";

  await GymGeofence.register({
    lat: options.lat,
    lng: options.lng,
    radiusM: options.radiusM,
    identifier: "one-more-home-gym",
    notificationTitle: UI.gymGeofenceEnterTitle,
    notificationBody: UI.gymGeofenceEnterBody,
    deepLinkRoute: buildGymGeofenceDeepLinkRoute(baseRoute),
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
