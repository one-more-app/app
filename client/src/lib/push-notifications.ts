import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";
import {
  NOTIFICATION_FEED_SWR_KEY,
  registerNotificationDevice,
} from "@/lib/notifications-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";
import { mutate } from "swr";

/** Doit correspondre à `android.notification.channelId` côté API + meta Manifest. */
export const ANDROID_PUSH_CHANNEL_ID = "one-more-push";

let registeredToken: string | null = null;

function devicePlatform(): "ios" | "android" {
  return Capacitor.getPlatform() === "ios" ? "ios" : "android";
}

function navigateToRoute(route: string) {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  window.location.hash = `#${normalized}`;
}

/** Canal Android avec son / vibration système (importance HIGH). */
export async function ensureAndroidPushChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  await PushNotifications.createChannel({
    id: ANDROID_PUSH_CHANNEL_ID,
    name: UI.notificationPushChannelName,
    description: UI.notificationPushChannelDescription,
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: "#dfff5e",
  });
}

export function getPushToken() {
  return registeredToken;
}

export async function requestPushPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === "granted") return true;
  const req = await PushNotifications.requestPermissions();
  return req.receive === "granted";
}

export async function isPushPermissionGranted(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const perm = await PushNotifications.checkPermissions();
  return perm.receive === "granted";
}

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestPushPermission();
  if (!granted) return;

  await registerPushIfPermitted();
}

/** Enregistre le token push sans redemander la permission (listeners requis). */
export async function registerPushIfPermitted(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") return;
  await ensureAndroidPushChannel();
  await PushNotifications.register();
}

export async function syncPushTokenWithApi(token: string) {
  registeredToken = token;
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  await registerNotificationDevice({
    token,
    platform: devicePlatform(),
    timezone,
  });
}

export function attachPushNotificationListeners() {
  if (!Capacitor.isNativePlatform()) return () => {};

  void ensureAndroidPushChannel().catch(() => {
    /* Canal optionnel au boot ; réessaie à l'enregistrement. */
  });

  const regHandle = PushNotifications.addListener(
    "registration",
    (token: Token) => {
      void syncPushTokenWithApi(token.value).catch(() => {
        /* API indisponible — réessaiera au prochain lancement. */
      });
    },
  );

  const regErrorHandle = PushNotifications.addListener(
    "registrationError",
    () => {
      /* Permission refusée ou config Firebase manquante. */
    },
  );

  const receivedHandle = PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      void mutate(NOTIFICATION_FEED_SWR_KEY);
      const title = notification.title ?? UI.notificationDefaultTitle;
      const body = notification.body ?? "";
      const route = notification.data?.route;
      if (!body) return;
      toast(title, {
        description: body,
        ...(typeof route === "string" && route.length > 0
          ? {
              action: {
                label: UI.notificationSeeAction,
                onClick: () => navigateToRoute(route),
              },
            }
          : {}),
      });
    },
  );

  const actionHandle = PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      const route = action.notification.data?.route;
      if (typeof route === "string" && route.length > 0) {
        navigateToRoute(route);
      }
    },
  );

  return () => {
    void regHandle.then((h) => h.remove());
    void regErrorHandle.then((h) => h.remove());
    void receivedHandle.then((h) => h.remove());
    void actionHandle.then((h) => h.remove());
  };
}
