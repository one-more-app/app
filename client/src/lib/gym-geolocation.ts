import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type GymCoords = { lat: number; lng: number };

export type GymLocationErrorKind = "permission_denied" | "unavailable";

export type GetGymCoordsOptions = {
  /**
   * Nearby search: cache / réseau uniquement (pas de GPS précis).
   * Sinon GPS haute précision (arrivée à la salle).
   */
  preferFast?: boolean;
};

export class GymLocationError extends Error {
  readonly kind: GymLocationErrorKind;

  constructor(kind: GymLocationErrorKind, message?: string) {
    super(message ?? kind);
    this.name = "GymLocationError";
    this.kind = kind;
  }
}

export function isGymLocationError(error: unknown): error is GymLocationError {
  return error instanceof GymLocationError;
}

/** True only when permission is already granted (does not prompt). Web always false. */
export async function isGymLocationPermissionGranted(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const current = await Geolocation.checkPermissions();
    return current.location === "granted";
  } catch {
    return false;
  }
}

export async function requestGymLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return Boolean(navigator.geolocation);
  }
  const current = await Geolocation.checkPermissions();
  if (current.location === "granted") return true;
  const requested = await Geolocation.requestPermissions();
  return requested.location === "granted";
}

function toGymLocationError(error: unknown): GymLocationError {
  if (isGymLocationError(error)) return error;
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: number }).code === 1
  ) {
    return new GymLocationError("permission_denied");
  }
  return new GymLocationError("unavailable");
}

type PositionOptions = {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
};

/** Instantané si un fix récent existe (jusqu'à 5 min). */
const CACHED_POSITION: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 1_000,
  maximumAge: 300_000,
};

/** Réseau / Wi‑Fi, sans attendre le GPS. */
const NETWORK_POSITION: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 4_000,
  maximumAge: 0,
};

/** GPS précis pour confirmer « je suis à la salle ». */
const PRECISE_POSITION: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

async function readNativePosition(options: PositionOptions): Promise<GymCoords> {
  try {
    const pos = await Geolocation.getCurrentPosition(options);
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (error) {
    throw toGymLocationError(error);
  }
}

async function readWebPosition(options: PositionOptions): Promise<GymCoords> {
  if (!navigator.geolocation) {
    throw new GymLocationError("unavailable");
  }

  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => {
          reject(
            err.code === 1
              ? new GymLocationError("permission_denied")
              : new GymLocationError("unavailable"),
          );
        },
        options,
      );
    });
  } catch (error) {
    throw toGymLocationError(error);
  }
}

async function readPosition(options: PositionOptions): Promise<GymCoords> {
  if (Capacitor.isNativePlatform()) {
    return await readNativePosition(options);
  }
  return await readWebPosition(options);
}

async function readFastPosition(): Promise<GymCoords> {
  try {
    return await readPosition(CACHED_POSITION);
  } catch (error) {
    if (isGymLocationError(error) && error.kind === "permission_denied") {
      throw error;
    }
  }

  return await readPosition(NETWORK_POSITION);
}

export async function getCurrentGymCoords(
  options?: GetGymCoordsOptions,
): Promise<GymCoords> {
  if (options?.preferFast) {
    // Pas de fallback GPS : un nearby 5 km n'en a pas besoin, et ça double l'attente.
    return await readFastPosition();
  }

  return await readPosition(PRECISE_POSITION);
}
