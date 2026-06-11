import { apiFetch } from "@/lib/api";

export type NotificationPreferences = {
  streakReminders: boolean;
  friendRequests: boolean;
  friendAccepted: boolean;
  messages: boolean;
  friendTraining: boolean;
  friendRecords: boolean;
  weeklyRecap: boolean;
};

export type DevicePlatform = "ios" | "android";

export async function registerNotificationDevice(params: {
  token: string;
  platform: DevicePlatform;
  timezone: string;
}) {
  return apiFetch<{ ok: boolean }>("/notifications/devices", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function unregisterNotificationDevice(token: string) {
  return apiFetch<{ ok: boolean }>("/notifications/devices", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>("/notifications/preferences");
}

export async function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function fetchTrainingAlertFriendIds(): Promise<string[]> {
  const res = await apiFetch<{ friendIds: string[] }>(
    "/notifications/training-alerts",
  );
  return res.friendIds;
}

export async function enableTrainingAlert(friendId: string) {
  return apiFetch<{ ok: boolean; friendId: string }>(
    `/notifications/training-alerts/${friendId}`,
    { method: "PUT" },
  );
}

export async function disableTrainingAlert(friendId: string) {
  return apiFetch<{ ok: boolean }>(
    `/notifications/training-alerts/${friendId}`,
    { method: "DELETE" },
  );
}
