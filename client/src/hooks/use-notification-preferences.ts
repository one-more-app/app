import { useAuth } from "@/hooks/use-auth";
import {
  fetchNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications-api";
import useSWR from "swr";

export const NOTIFICATION_PREFERENCES_SWR_KEY = "notification-preferences";

/** Préférences de notifications (clé SWR partagée avec les Réglages). */
export function useNotificationPreferences() {
  const auth = useAuth();
  return useSWR<NotificationPreferences>(
    auth.status === "authenticated" ? NOTIFICATION_PREFERENCES_SWR_KEY : null,
    fetchNotificationPreferences,
  );
}
