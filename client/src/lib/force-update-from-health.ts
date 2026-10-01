import { isBelowMinVersion } from "@/lib/app-version";

export type HealthMinVersion = {
  ios?: string;
  android?: string;
};

export type HealthProbeBody = {
  status?: unknown;
  minVersion?: HealthMinVersion | null;
};

export function shouldForceUpdateFromHealth(input: {
  isNativePlatform: boolean;
  platform: string; // "ios" | "android" | ...
  currentVersion: string;
  body: HealthProbeBody | null;
}): boolean {
  if (!input.isNativePlatform) return false;
  const min =
    input.platform === "ios"
      ? input.body?.minVersion?.ios
      : input.platform === "android"
        ? input.body?.minVersion?.android
        : undefined;
  if (!min) return false;
  return isBelowMinVersion(input.currentVersion, min);
}
