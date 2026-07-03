import {
  getRestTargetMs,
  getTrackedExerciseById,
} from "@/lib/storage";
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
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: REST_FINISHED_NOTIFICATION_ID }],
    });
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

export async function syncRestFinishedLocalNotification(
  params: RestFinishedLocalNotificationParams | null,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await cancelRestFinishedLocalNotification();
  if (!params) return;

  const start = new Date(params.createdAt).getTime();
  if (Number.isNaN(start)) return;

  const fireAt = start + params.targetMs;
  const now = Date.now();
  if (fireAt <= now) return;
  if (!isRestSinceLastSetVisible(params.createdAt, now)) return;

  const granted = await ensureRestTimerNotificationPermission();
  if (!granted) return;

  await ensureRestTimerChannel();

  const route = `/exercise/${params.exerciseId}`;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REST_FINISHED_NOTIFICATION_ID,
        title: UI.restTimeFinished,
        body: params.exerciseName,
        channelId: REST_TIMER_CHANNEL_ID,
        schedule: { at: new Date(fireAt) },
        extra: { route, exerciseId: params.exerciseId },
      },
    ],
  });
}

export function scheduleRestFinishedLocalNotificationForEntry(
  entry: PerformanceEntry,
): void {
  if (!Capacitor.isNativePlatform()) return;

  const exercise = getTrackedExerciseById(entry.trackedExerciseId);
  if (!exercise) return;

  void syncRestFinishedLocalNotification({
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
      /* Premier plan : le toast in-app prend le relais — pas de bannière système en double. */
      void LocalNotifications.removeDeliveredNotifications({
        notifications: [{ id: REST_FINISHED_NOTIFICATION_ID }],
      });
    },
  );

  return () => {
    void actionHandle.then((handle) => handle.remove());
    void receivedHandle.then((handle) => handle.remove());
  };
}
