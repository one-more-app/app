import {
  getRestTargetMs,
  getTrackedExerciseById,
} from "@/lib/storage";
import { subscribeAppStateChange } from "@/lib/app-state-listener";
import { UI } from "@/lib/translations";
import { isRestSinceLastSetVisible } from "@/lib/format-rest-elapsed";
import type { PerformanceEntry } from "@/types";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { RestTimer } from "rest-timer";

/** ID fixe — une seule notif repos à la fois (aligné natif Android). */
export const REST_FINISHED_NOTIFICATION_ID = 42;

let lastSyncedKey: string | null = null;
let lifecycleEnabled = false;
let currentParams: RestFinishedLocalNotificationParams | null = null;
let unsubscribeAppState: (() => void) | null = null;
let syncInFlight: Promise<void> | null = null;

function paramsKey(params: RestFinishedLocalNotificationParams | null): string {
  if (!params) return "";
  return `${params.exerciseId}:${params.createdAt}:${params.targetMs}`;
}

export async function ensureRestTimerNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const current = await RestTimer.checkPermissions();
    if (current.granted) return true;
    const requested = await RestTimer.requestPermissions();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function cancelRestFinishedLocalNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (lastSyncedKey === "") return;
  try {
    await RestTimer.cancel();
    lastSyncedKey = "";
  } catch {
    /* ignore */
  }
}

export type RestFinishedLocalNotificationParams = {
  createdAt: string;
  targetMs: number;
  exerciseId: string;
  exerciseName: string;
};

function capitalizeExerciseName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase("fr-FR") + trimmed.slice(1);
}

function buildStartPayload(
  params: RestFinishedLocalNotificationParams,
): Parameters<typeof RestTimer.start>[0] {
  const route = `/exercise/${params.exerciseId}`;
  return {
    createdAt: params.createdAt,
    targetMs: params.targetMs,
    exerciseId: params.exerciseId,
    exerciseName: capitalizeExerciseName(params.exerciseName),
    title: UI.restSinceLastSet,
    finishedTitle: UI.restTimeFinished,
    deepLinkRoute: route,
  };
}

async function syncRestFinishedLocalNotificationInternal(
  params: RestFinishedLocalNotificationParams | null,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!lifecycleEnabled) return;

  const key = paramsKey(params);
  if (key === lastSyncedKey) return;

  if (!params) {
    await cancelRestFinishedLocalNotification();
    return;
  }

  const start = new Date(params.createdAt).getTime();
  if (Number.isNaN(start)) {
    await cancelRestFinishedLocalNotification();
    return;
  }

  const fireAt = start + params.targetMs;
  const now = Date.now();
  if (fireAt <= now || !isRestSinceLastSetVisible(params.createdAt, now)) {
    await cancelRestFinishedLocalNotification();
    return;
  }

  const granted = await ensureRestTimerNotificationPermission();
  if (!granted) {
    await cancelRestFinishedLocalNotification();
    return;
  }

  await cancelRestFinishedLocalNotification();

  await RestTimer.start(buildStartPayload(params));
  try {
    const { isActive } = await CapacitorApp.getState();
    await RestTimer.setForegroundVisible({ visible: !isActive });
  } catch {
    /* ignore */
  }
  lastSyncedKey = key;
}

export async function syncRestFinishedLocalNotification(
  params: RestFinishedLocalNotificationParams | null,
): Promise<void> {
  currentParams = params;
  if (!lifecycleEnabled) return;

  if (syncInFlight) {
    await syncInFlight;
  }

  syncInFlight = syncRestFinishedLocalNotificationInternal(params).finally(() => {
    syncInFlight = null;
  });
  await syncInFlight;
}

function attachAppStateListener(): void {
  if (unsubscribeAppState || !Capacitor.isNativePlatform()) return;

  unsubscribeAppState = subscribeAppStateChange((isActive) => {
    if (!lifecycleEnabled) return;
    void RestTimer.setForegroundVisible({ visible: !isActive });
    if (!isActive) {
      void syncRestFinishedLocalNotificationInternal(currentParams);
    }
  });
}

function detachAppStateListener(): void {
  unsubscribeAppState?.();
  unsubscribeAppState = null;
}

export function setRestTimerLifecycleEnabled(enabled: boolean): void {
  lifecycleEnabled = enabled;
  if (!enabled) {
    currentParams = null;
    detachAppStateListener();
    void cancelRestFinishedLocalNotification();
    return;
  }
  attachAppStateListener();
  void syncRestFinishedLocalNotificationInternal(currentParams);
}

export function updateRestTimerNotificationParams(
  params: RestFinishedLocalNotificationParams | null,
): void {
  currentParams = params;
  if (!lifecycleEnabled) return;

  if (!params) {
    void cancelRestFinishedLocalNotification();
    return;
  }

  const key = paramsKey(params);
  if (key === lastSyncedKey) return;

  void (async () => {
    const start = new Date(params.createdAt).getTime();
    if (Number.isNaN(start)) return;

    const fireAt = start + params.targetMs;
    const now = Date.now();
    if (fireAt <= now || !isRestSinceLastSetVisible(params.createdAt, now)) {
      await cancelRestFinishedLocalNotification();
      return;
    }

    if (lastSyncedKey && lastSyncedKey.split(":")[0] === params.exerciseId) {
      try {
        await RestTimer.update({ targetMs: params.targetMs });
        lastSyncedKey = key;
        return;
      } catch {
        /* Repart sur un start complet. */
      }
    }

    await syncRestFinishedLocalNotificationInternal(params);
  })();
}

export function scheduleRestFinishedLocalNotificationForEntry(
  entry: PerformanceEntry,
): void {
  if (!Capacitor.isNativePlatform() || !lifecycleEnabled) return;

  const exercise = getTrackedExerciseById(entry.trackedExerciseId);
  if (!exercise) return;

  void syncRestFinishedLocalNotificationInternal({
    createdAt: entry.createdAt,
    targetMs: getRestTargetMs(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
  });
}

export function attachRestTimerLocalNotificationListeners(): () => void {
  return () => {};
}
