import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type GymCoords = { lat: number; lng: number };

export async function requestGymLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return Boolean(navigator.geolocation);
  }
  const current = await Geolocation.checkPermissions();
  if (current.location === "granted") return true;
  const requested = await Geolocation.requestPermissions();
  return requested.location === "granted";
}

export async function getCurrentGymCoords(): Promise<GymCoords> {
  if (Capacitor.isNativePlatform()) {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
  return await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}
