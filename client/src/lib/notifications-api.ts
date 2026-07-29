import { apiFetch } from "@/lib/api";

export type NotificationPreferences = {
  streakReminders: boolean;
  friendRequests: boolean;
  friendAccepted: boolean;
  messages: boolean;
  sessionComments: boolean;
  friendTraining: boolean;
  friendRecords: boolean;
  weeklyRecap: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  streakReminders: true,
  friendRequests: true,
  friendAccepted: true,
  messages: true,
  sessionComments: true,
  friendTraining: true,
  friendRecords: true,
  weeklyRecap: true,
};

export function mergeNotificationPreferences(
  current: Partial<NotificationPreferences> | undefined,
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...current,
    ...patch,
  };
}

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

/** Friend IDs for which training alerts are muted (opt-out). Default: all friends notified. */
export async function fetchMutedTrainingAlertFriendIds(): Promise<string[]> {
  const res = await apiFetch<{ mutedFriendIds: string[] }>(
    "/notifications/training-alerts",
  );
  return res.mutedFriendIds;
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

export type NotificationFeedItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  route: string | null;
  sentAt: string;
  readAt: string | null;
};

export type NotificationFeedResponse = {
  items: NotificationFeedItem[];
  unreadCount: number;
};

export const NOTIFICATION_FEED_SWR_KEY = "notification-feed";

export async function fetchNotificationFeed(): Promise<NotificationFeedResponse> {
  return apiFetch<NotificationFeedResponse>("/notifications/feed");
}

export async function markNotificationsRead(
  ids?: string[],
): Promise<{ unreadCount: number }> {
  return apiFetch<{ unreadCount: number }>("/notifications/feed/read", {
    method: "POST",
    body: JSON.stringify(ids ? { ids } : {}),
  });
}
