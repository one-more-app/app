import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";
import { registerNotificationDevice } from "@/lib/notifications-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

let registeredToken: string | null = null;

function devicePlatform(): "ios" | "android" {
  return Capacitor.getPlatform() === "ios" ? "ios" : "android";
}

function navigateToRoute(route: string) {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  window.location.hash = `#${normalized}`;
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

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestPushPermission();
  if (!granted) return;

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
      const title = notification.title ?? UI.notificationDefaultTitle;
      const body = notification.body ?? "";
      if (body) toast(title, { description: body });
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
