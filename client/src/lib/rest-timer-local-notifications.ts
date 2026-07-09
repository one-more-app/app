import {
  getRestTargetMs,
  getTrackedExerciseById,
} from "@/lib/storage";
import { subscribeAppStateChange } from "@/lib/app-state-listener";
import { UI } from "@/lib/translations";
import {
  isRestSinceLastSetVisible,
} from "@/lib/format-rest-elapsed";
import type { PerformanceEntry } from "@/types";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/** ID fixe — une seule notif repos planifiée à la fois. */
export const REST_FINISHED_NOTIFICATION_ID = 42;

const REST_TIMER_CHANNEL_ID = "rest-timer";

let channelReady = false;
let lastSyncedKey: string | null = null;
let lifecycleEnabled = false;
let currentParams: RestFinishedLocalNotificationParams | null = null;
let unsubscribeAppState: (() => void) | null = null;
let syncInFlight: Promise<void> | null = null;

function paramsKey(params: RestFinishedLocalNotificationParams | null): string {
  if (!params) return "";
  return `${params.exerciseId}:${params.createdAt}:${params.targetMs}`;
}

async function ensureRestTimerChannel(): Promise<void> {
  if (channelReady || Capacitor.getPlatform() !== "android") return;
  try {
    await LocalNotifications.createChannel({
      id: REST_TIMER_CHANNEL_ID,
      name: UI.restTimeSettingsTitle,
      description: UI.restTimeFinished,
      importance: 4,
      visibility: 1,
      vibration: true,
    });
    channelReady = true;
  } catch {
    /* Canal déjà créé ou plugin indisponible. */
  }
}

export async function ensureRestTimerNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted";
  } catch {
    return false;
  }
}

export async function cancelRestFinishedLocalNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (lastSyncedKey === "") return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: REST_FINISHED_NOTIFICATION_ID }],
    });
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
  await ensureRestTimerChannel();

  const route = `/exercise/${params.exerciseId}`;
  const platform = Capacitor.getPlatform();

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REST_FINISHED_NOTIFICATION_ID,
        title: UI.restTimeFinished,
        body: params.exerciseName,
        channelId: REST_TIMER_CHANNEL_ID,
        schedule: {
          at: new Date(fireAt),
          allowWhileIdle: platform === "android",
        },
        ...(platform === "ios" ? { silent: true } : {}),
        extra: { route, exerciseId: params.exerciseId },
      },
    ],
  });
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
    if (isActive) {
      void cancelRestFinishedLocalNotification();
      return;
    }
    void syncRestFinishedLocalNotificationInternal(currentParams);
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
  void syncRestFinishedLocalNotificationInternal(params);
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
  if (!Capacitor.isNativePlatform()) return () => {};

  const navigateToRoute = (route: string) => {
    const normalized = route.startsWith("/") ? route : `/${route}`;
    window.location.hash = `#${normalized}`;
  };

  const actionHandle = LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      const route = event.notification.extra?.route;
      if (typeof route === "string" && route.length > 0) {
        navigateToRoute(route);
      }
    },
  );

  const receivedHandle = LocalNotifications.addListener(
    "localNotificationReceived",
    () => {
      void LocalNotifications.removeDeliveredNotifications({
        notifications: [
          {
            id: REST_FINISHED_NOTIFICATION_ID,
            title: "",
            body: "",
          },
        ],
      });
    },
  );

  return () => {
    void actionHandle.then((handle) => handle.remove());
    void receivedHandle.then((handle) => handle.remove());
  };
}
