/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkPermissions, requestPermissions } = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    getLaunchUrl: vi.fn(async () => ({ url: "" })),
    addListener: vi.fn(async () => ({ remove: vi.fn() })),
    getState: vi.fn(async () => ({ isActive: true })),
  },
}));

vi.mock("rest-timer", () => ({
  RestTimer: {
    checkPermissions,
    requestPermissions,
    cancel: vi.fn(async () => undefined),
    start: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    setForegroundVisible: vi.fn(async () => undefined),
    consumeSuppressToastExerciseId: vi.fn(async () => ({ exerciseId: null })),
  },
}));

vi.mock("@/lib/storage", () => ({
  getRestTargetMs: () => 90_000,
  getTrackedExerciseById: () => null,
  isRestTimerEnabled: () => true,
}));

vi.mock("@/lib/app-state-listener", () => ({
  subscribeAppStateChange: () => () => undefined,
}));

vi.mock("@/lib/translations", () => ({
  UI: {
    restSinceLastSet: "Repos",
    restTimeFinished: "Fini",
  },
}));

vi.mock("@/lib/format-rest-elapsed", () => ({
  isRestSinceLastSetVisible: () => true,
}));

vi.mock("@/lib/rest-timer-exclude", () => ({
  clearRestTimerExcludedPerformances: () => undefined,
}));

import { ensureRestTimerNotificationPermission } from "./rest-timer-local-notifications";

describe("ensureRestTimerNotificationPermission", () => {
  beforeEach(() => {
    checkPermissions.mockReset();
    requestPermissions.mockReset();
  });

  it("ne déclenche pas le prompt système tant que l'utilisateur n'a pas activé les notifications", async () => {
    checkPermissions.mockResolvedValue({ granted: false });

    const granted = await ensureRestTimerNotificationPermission();

    expect(granted).toBe(false);
    expect(checkPermissions).toHaveBeenCalledOnce();
    expect(requestPermissions).not.toHaveBeenCalled();
  });
});
