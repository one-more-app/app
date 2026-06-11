import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  fetchNotificationPreferences,
  sendTestPushNotification,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications-api";
import {
  refreshPushToken,
  requestPushPermission,
} from "@/lib/push-notifications";
import { pushDebug } from "@/lib/push-debug";
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
      <Label htmlFor={id} className="text-sm font-normal leading-snug">
        {label}
      </Label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-background shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsCard() {
  const { data, mutate, isLoading } = useSWR(
    "notification-preferences",
    fetchNotificationPreferences,
  );
  const [busyKey, setBusyKey] = useState<PrefKey | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleToggle = useCallback(
    async (key: PrefKey, next: boolean) => {
      setBusyKey(key);
      try {
        const updated = await updateNotificationPreferences({ [key]: next });
        await mutate(updated, false);
      } catch {
        toast.error(UI.notifPrefSaveError);
      } finally {
        setBusyKey(null);
      }
    },
    [mutate],
  );

  const requestPushFromSettings = useCallback(async (source: string) => {
    console.log("[push] NotificationSettingsCard: request permission", {
      source,
      platform: Capacitor.getPlatform(),
    });
    const granted = await requestPushPermission();
    console.log("[push] NotificationSettingsCard: permission result", {
      source,
      granted,
      platform: Capacitor.getPlatform(),
    });
  }, []);

  useEffect(() => {
    if (!isNative) return;
    void requestPushFromSettings("mount");
  }, [isNative, requestPushFromSettings]);

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
          <div className="mb-2 space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                void requestPushFromSettings("button");
              }}
            >
              {UI.notificationsEnablePush}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={refreshBusy}
              onClick={() => {
                setRefreshBusy(true);
                void refreshPushToken()
                  .then(() => {
                    toast.success(UI.notifRefreshTokenOk);
                  })
                  .finally(() => {
                    setRefreshBusy(false);
                  });
              }}
            >
              {UI.notifRefreshToken}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={testBusy}
              onClick={() => {
                setTestBusy(true);
                pushDebug("NotificationSettingsCard.tsx:test", "test-push clicked", {}, "H-B");
                void sendTestPushNotification()
                  .then((res) => {
                    console.log("[push] test-push API result", res);
                    pushDebug("NotificationSettingsCard.tsx:test-result", "test-push API response", {
                      ok: res.ok,
                      firebaseConfigured: res.firebaseConfigured,
                      resultCount: res.results.length,
                      results: res.results.map((r) => ({
                        platform: r.platform,
                        success: r.success,
                        errorCode: r.errorCode ?? null,
                        tokenSuffix: r.tokenSuffix,
                      })),
                    }, "H-B");
                    if (res.ok) {
                      toast.success(UI.notifTestPushOk);
                      return;
                    }
                    const detail = res.results
                      .map(
                        (r) =>
                          `${r.platform}: ${r.errorCode ?? "no-token"} ${r.errorMessage ?? ""}`.trim(),
                      )
                      .join(" | ");
                    toast.error(UI.notifTestPushError, { description: detail });
                  })
                  .catch((err) => {
                    console.error("[push] test-push API failed", err);
                    toast.error(UI.notifTestPushError);
                  })
                  .finally(() => {
                    setTestBusy(false);
                  });
              }}
            >
              {UI.notifTestPush}
            </Button>
          </div>
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
              checked={data?.[item.key] ?? true}
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
