import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  fetchNotificationPreferences,
  mergeNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications-api";
import { requestPushPermission } from "@/lib/push-notifications";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

type PrefKey = keyof NotificationPreferences;

const TOGGLE_ITEMS: Array<{ key: PrefKey; label: string }> = [
  { key: "streakReminders", label: UI.notifPrefStreak },
  { key: "friendRequests", label: UI.notifPrefFriendRequests },
  { key: "friendAccepted", label: UI.notifPrefFriendAccepted },
  { key: "messages", label: UI.notifPrefMessages },
  { key: "friendTraining", label: UI.notifPrefFriendTraining },
  { key: "friendRecords", label: UI.notifPrefFriendRecords },
  { key: "weeklyRecap", label: UI.notifPrefWeeklyRecap },
];

function NotificationToggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-3">
      <Label htmlFor={id} className="min-w-0 flex-1 text-sm font-normal leading-snug">
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function NotificationSettingsCard() {
  const { data, mutate, isLoading } = useSWR(
    "notification-preferences",
    fetchNotificationPreferences,
  );
  const [busyKey, setBusyKey] = useState<PrefKey | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const handleToggle = useCallback(
    async (key: PrefKey, next: boolean) => {
      setBusyKey(key);
      try {
        await mutate(
          async (current) => {
            const updated = await updateNotificationPreferences({ [key]: next });
            return mergeNotificationPreferences(current, { [key]: updated[key] });
          },
          {
            optimisticData: (current) =>
              mergeNotificationPreferences(current, { [key]: next }),
            rollbackOnError: true,
            revalidate: false,
          },
        );
      } catch {
        toast.error(UI.notifPrefSaveError);
      } finally {
        setBusyKey(null);
      }
    },
    [mutate],
  );

  useEffect(() => {
    if (!isNative) return;
    void requestPushPermission();
  }, [isNative]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI.notifications}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {UI.notificationsDescription}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isNative ? (
          <Button
            type="button"
            variant="secondary"
            className="mb-2 w-full"
            onClick={() => {
              void requestPushPermission();
            }}
          >
            {UI.notificationsEnablePush}
          </Button>
        ) : (
          <p className="mb-2 text-xs text-muted-foreground">
            {UI.notificationsNativeOnly}
          </p>
        )}
        {isLoading && !data ? (
          <p className="text-sm text-muted-foreground">{UI.loading}</p>
        ) : (
          TOGGLE_ITEMS.map((item) => (
            <NotificationToggle
              key={item.key}
              id={`notif-${item.key}`}
              label={item.label}
              checked={
                data?.[item.key] ?? DEFAULT_NOTIFICATION_PREFERENCES[item.key]
              }
              disabled={busyKey === item.key}
              onChange={(next) => {
                void handleToggle(item.key, next);
              }}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
