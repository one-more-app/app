import { isBelowMinVersion } from "@/lib/app-version";

export type HealthMinVersion = {
  ios?: string;
  android?: string;
};

export type HealthProbeBody = {
  status?: unknown;
  minVersion?: HealthMinVersion | null;
};

/** Version minimale pour la plateforme courante (undefined si aucune). */
export function minVersionForPlatform(
  body: HealthProbeBody | null,
  platform: string,
): string | undefined {
  const min =
    platform === "ios"
      ? body?.minVersion?.ios
      : platform === "android"
        ? body?.minVersion?.android
        : undefined;
  return typeof min === "string" && min ? min : undefined;
}

export function shouldForceUpdateFromHealth(input: {
  isNativePlatform: boolean;
  platform: string; // "ios" | "android" | ...
  currentVersion: string;
  body: HealthProbeBody | null;
}): boolean {
  if (!input.isNativePlatform) return false;
  const min = minVersionForPlatform(input.body, input.platform);
  if (!min) return false;
  return isBelowMinVersion(input.currentVersion, min);
}
