import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";
import { registerNotificationDevice } from "@/lib/notifications-api";
import { pushDebug } from "@/lib/push-debug";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

let registeredToken: string | null = null;

const LOG = "[push]";

/** APNs brut (64 hex) ≠ token FCM attendu par Firebase Admin / console. */
function tokenKind(token: string): "apns" | "fcm" | "unknown" {
  if (/^[0-9a-f]{64}$/i.test(token)) return "apns";
  if (token.length > 80) return "fcm";
  return "unknown";
}

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
  if (!Capacitor.isNativePlatform()) {
    console.log(LOG, "requestPushPermission: skipped (not native)");
    return false;
  }
  const platform = devicePlatform();
  const perm = await PushNotifications.checkPermissions();
  console.log(LOG, "checkPermissions", { platform, receive: perm.receive });
  if (perm.receive === "granted") return true;
  const req = await PushNotifications.requestPermissions();
  console.log(LOG, "requestPermissions result", {
    platform,
    receive: req.receive,
  });
  return req.receive === "granted";
}

export async function refreshPushToken() {
  if (!Capacitor.isNativePlatform()) return;
  console.log(LOG, "refreshPushToken: unregister + register");
  try {
    await PushNotifications.unregister();
  } catch (err) {
    console.warn(LOG, "refreshPushToken: unregister failed", err);
  }
  await registerPushNotifications();
}

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log(LOG, "registerPushNotifications: skipped (not native)");
    return;
  }

  const platform = devicePlatform();
  console.log(LOG, "registerPushNotifications: start", { platform });

  const granted = await requestPushPermission();
  if (!granted) {
    console.warn(LOG, "registerPushNotifications: permission denied", {
      platform,
    });
    return;
  }

  console.log(LOG, "PushNotifications.register() calling…", { platform });
  await PushNotifications.register();
  console.log(LOG, "PushNotifications.register() done (awaiting token event)", {
    platform,
  });
}

export async function syncPushTokenWithApi(token: string) {
  registeredToken = token;
  const platform = devicePlatform();
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const tokenPreview = `${token.slice(0, 8)}…${token.slice(-6)}`;
  console.log(LOG, "syncPushTokenWithApi: start", {
    platform,
    timezone,
    tokenKind: tokenKind(token),
    tokenLength: token.length,
    tokenPreview,
  });
  try {
    const res = await registerNotificationDevice({
      token,
      platform,
      timezone,
    });
    console.log(LOG, "syncPushTokenWithApi: API ok", { platform, res });
  } catch (err) {
    console.error(LOG, "syncPushTokenWithApi: API failed", {
      platform,
      err,
    });
    throw err;
  }
}

export function attachPushNotificationListeners() {
  if (!Capacitor.isNativePlatform()) {
    console.log(LOG, "attachPushNotificationListeners: skipped (not native)");
    return () => {};
  }

  const platform = devicePlatform();
  console.log(LOG, "attachPushNotificationListeners: attaching", { platform });

  const regHandle = PushNotifications.addListener(
    "registration",
    (token: Token) => {
      const kind = tokenKind(token.value);
      console.log(LOG, "registration event", {
        platform,
        tokenKind: kind,
        tokenLength: token.value.length,
        tokenPreview: `${token.value.slice(0, 8)}…${token.value.slice(-6)}`,
      });
      pushDebug("push-notifications.ts:registration", "token registered", {
        platform,
        tokenKind: kind,
        tokenLength: token.value.length,
        tokenSuffix: token.value.slice(-8),
      }, "H-A");
      if (platform === "ios" && kind === "apns") {
        console.warn(
          LOG,
          "Token iOS de type APNs — Firebase ne peut pas envoyer dessus. Attendu: token FCM (longueur > 80).",
        );
      }
      void syncPushTokenWithApi(token.value).catch((err) => {
        console.warn(LOG, "registration: API sync failed (will retry later)", {
          platform,
          err,
        });
      });
    },
  );

  const regErrorHandle = PushNotifications.addListener(
    "registrationError",
    (error: unknown) => {
      console.error(LOG, "registrationError event", {
        platform,
        error,
      });
    },
  );

  const receivedHandle = PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      console.log(LOG, "pushNotificationReceived", {
        platform,
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
      pushDebug("push-notifications.ts:received", "notification received in foreground", {
        platform,
        id: notification.id,
        hasTitle: Boolean(notification.title),
        hasBody: Boolean(notification.body),
      }, "H-C");
      const title = notification.title ?? UI.notificationDefaultTitle;
      const body = notification.body ?? "";
      if (body) {
        toast(title, { description: body });
      } else {
        console.warn(LOG, "pushNotificationReceived sans body — tester avec titre+corps dans Firebase");
      }
    },
  );

  const actionHandle = PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      console.log(LOG, "pushNotificationActionPerformed", {
        platform,
        actionId: action.actionId,
        notification: action.notification,
      });
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
