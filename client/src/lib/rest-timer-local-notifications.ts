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

export const REST_TIMER_FINISHED_DEEP_LINK_PARAM = "restFinished";

const REST_FINISHED_TOAST_SUPPRESS_KEY = "rest_timer_suppress_toast_exercise_id";

let lastSyncedKey: string | null = null;
let lifecycleEnabled = false;
let currentParams: RestFinishedLocalNotificationParams | null = null;
let unsubscribeAppState: (() => void) | null = null;
let syncInFlight: Promise<void> | null = null;
let suppressedRestFinishedToastExerciseId: string | null = null;

function paramsKey(params: RestFinishedLocalNotificationParams | null): string {
  if (!params) return "";
  return `${params.exerciseId}:${params.createdAt}:${params.targetMs}`;
}

export function buildRestFinishedDeepLinkRoute(exerciseId: string): string {
  return `/exercise/${exerciseId}?${REST_TIMER_FINISHED_DEEP_LINK_PARAM}=1`;
}

export function markRestFinishedOpenedFromNotification(exerciseId: string): void {
  suppressedRestFinishedToastExerciseId = exerciseId;
  try {
    sessionStorage.setItem(REST_FINISHED_TOAST_SUPPRESS_KEY, exerciseId);
  } catch {
    /* ignore */
  }
}

function readPersistedRestFinishedToastSuppression(exerciseId: string): boolean {
  try {
    const stored = sessionStorage.getItem(REST_FINISHED_TOAST_SUPPRESS_KEY);
    if (stored !== exerciseId) return false;
    sessionStorage.removeItem(REST_FINISHED_TOAST_SUPPRESS_KEY);
    return true;
  } catch {
    return false;
  }
}

export function consumeRestFinishedToastSuppression(exerciseId: string): boolean {
  if (suppressedRestFinishedToastExerciseId === exerciseId) {
    suppressedRestFinishedToastExerciseId = null;
    try {
      sessionStorage.removeItem(REST_FINISHED_TOAST_SUPPRESS_KEY);
    } catch {
      /* ignore */
    }
    return true;
  }
  return readPersistedRestFinishedToastSuppression(exerciseId);
}

function navigateToRoute(route: string): void {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  window.location.hash = `#${normalized}`;
}

export function parseRestFinishedNotificationUrl(
  url: string,
): { route: string; exerciseId: string } | null {
  try {
    const parsed = new URL(url);
    const hash = parsed.hash.replace(/^#/, "");
    if (!hash.startsWith("/")) return null;

    const queryIndex = hash.indexOf("?");
    const path = queryIndex >= 0 ? hash.slice(0, queryIndex) : hash;
    const query = queryIndex >= 0 ? hash.slice(queryIndex + 1) : "";
    const params = new URLSearchParams(query);
    if (params.get(REST_TIMER_FINISHED_DEEP_LINK_PARAM) !== "1") return null;

    const match = path.match(/^\/exercise\/([^/?]+)$/);
    if (!match?.[1]) return null;

    return {
      route: `${path}?${REST_TIMER_FINISHED_DEEP_LINK_PARAM}=1`,
      exerciseId: match[1],
    };
  } catch {
    return null;
  }
}

function handleRestFinishedNotificationOpen(url: string): boolean {
  const parsed = parseRestFinishedNotificationUrl(url);
  if (!parsed) return false;

  markRestFinishedOpenedFromNotification(parsed.exerciseId);
  navigateToRoute(parsed.route);
  clearRestFinishedDeepLinkFromUrl();
  return true;
}

export function shouldSkipRestFinishedToast(exerciseId: string): boolean {
  return consumeRestFinishedToastSuppression(exerciseId);
}

export function clearRestFinishedDeepLinkFromUrl(): void {
  if (typeof window === "undefined") return;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.includes(REST_TIMER_FINISHED_DEEP_LINK_PARAM)) return;

  const queryIndex = hash.indexOf("?");
  if (queryIndex < 0) return;

  const path = hash.slice(0, queryIndex);
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  params.delete(REST_TIMER_FINISHED_DEEP_LINK_PARAM);
  const query = params.toString();
  const nextHash = query ? `${path}?${query}` : path;
  if (nextHash === hash) return;
  window.location.hash = `#${nextHash}`;
}

export async function consumeNativeRestFinishedToastSuppression(
  exerciseId: string,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { exerciseId: suppressedId } = await RestTimer.consumeSuppressToastExerciseId();
    if (!suppressedId || suppressedId !== exerciseId) return false;
    markRestFinishedOpenedFromNotification(exerciseId);
    return true;
  } catch {
    return false;
  }
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
  return {
    createdAt: params.createdAt,
    targetMs: params.targetMs,
    exerciseId: params.exerciseId,
    exerciseName: capitalizeExerciseName(params.exerciseName),
    title: UI.restSinceLastSet,
    finishedTitle: UI.restTimeFinished,
    deepLinkRoute: buildRestFinishedDeepLinkRoute(params.exerciseId),
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

function primeRestFinishedNotificationSuppressionFromLaunchUrl(): void {
  if (!Capacitor.isNativePlatform()) return;
  void CapacitorApp.getLaunchUrl().then((result) => {
    if (!result?.url) return;
    handleRestFinishedNotificationOpen(result.url);
  });
  void RestTimer.consumeSuppressToastExerciseId().then(({ exerciseId }) => {
    if (typeof exerciseId === "string" && exerciseId.length > 0) {
      markRestFinishedOpenedFromNotification(exerciseId);
    }
  });
}

export function attachRestTimerLocalNotificationListeners(): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  primeRestFinishedNotificationSuppressionFromLaunchUrl();

  const appUrlHandle = CapacitorApp.addListener("appUrlOpen", (event) => {
    handleRestFinishedNotificationOpen(event.url);
  });

  return () => {
    void appUrlHandle.then((handle) => handle.remove());
  };
}

if (Capacitor.isNativePlatform()) {
  primeRestFinishedNotificationSuppressionFromLaunchUrl();
}
