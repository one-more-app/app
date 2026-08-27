import { ReminderScheduleFields } from "@/components/notifications/ReminderScheduleFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    DEFAULT_REMINDER_SLOTS,
    formatReminderSchedule,
    reminderSlotsFromPrefs,
    type ReminderSlot,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

type ToggleKey = Exclude<
    keyof NotificationPreferences,
    "reminderWeekdays" | "reminderHour" | "reminderMinute" | "reminderSlots"
>;
type BusyKey = ToggleKey | "reminderSchedule";

const TOGGLE_ITEMS: Array<{ key: ToggleKey; label: string }> = [
    { key: "streakReminders", label: UI.notifPrefStreak },
    { key: "friendRequests", label: UI.notifPrefFriendRequests },
    { key: "friendAccepted", label: UI.notifPrefFriendAccepted },
    { key: "messages", label: UI.notifPrefMessages },
    { key: "sessionComments", label: UI.notifPrefSessionComments },
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
    const [busyKey, setBusyKey] = useState<BusyKey | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [draftSlots, setDraftSlots] = useState<ReminderSlot[]>(DEFAULT_REMINDER_SLOTS);
    const isNative = Capacitor.isNativePlatform();
    const streakOn =
        data?.streakReminders ?? DEFAULT_NOTIFICATION_PREFERENCES.streakReminders;
    const savedSlots = reminderSlotsFromPrefs(data ?? {});
    const savedSummary = formatReminderSchedule(savedSlots);

    const handleToggle = useCallback(
        async (key: ToggleKey, next: boolean) => {
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

    const openSchedule = () => {
        setDraftSlots(savedSlots);
        setScheduleOpen(true);
    };

    const handleScheduleSave = async () => {
        if (busyKey === "reminderSchedule") return;
        setBusyKey("reminderSchedule");
        try {
            await mutate(
                async (current) => {
                    const updated = await updateNotificationPreferences({
                        streakReminders: true,
                        reminderSlots: draftSlots,
                    });
                    return mergeNotificationPreferences(current, updated);
                },
                {
                    optimisticData: (current) =>
                        mergeNotificationPreferences(current, {
                            streakReminders: true,
                            reminderSlots: draftSlots,
                        }),
                    rollbackOnError: true,
                    revalidate: false,
                },
            );
            setScheduleOpen(false);
        } catch {
            toast.error(UI.notifPrefSaveError);
        } finally {
            setBusyKey(null);
        }
    };

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
                        <div key={item.key} className="space-y-2">
                            <NotificationToggle
                                id={`notif-${item.key}`}
                                label={item.label}
                                checked={
                                    data?.[item.key] ??
                                    DEFAULT_NOTIFICATION_PREFERENCES[item.key]
                                }
                                disabled={busyKey === item.key}
                                onChange={(next) => {
                                    void handleToggle(item.key, next);
                                }}
                            />
                            {item.key === "streakReminders" && streakOn ? (
                                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {UI.notifPrefReminderSchedule}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {savedSummary || UI.notifPrefReminderNone}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        data-analytics-label="reminder_schedule_edit"
                                        onClick={openSchedule}
                                    >
                                        {UI.notifPrefReminderEdit}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </CardContent>

            <Dialog
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                data-analytics-label="reminder_schedule"
            >
                <DialogContent className="sm:max-w-md" showCloseButton>
                    <DialogHeader>
                        <DialogTitle>{UI.notifPrefReminderSchedule}</DialogTitle>
                    </DialogHeader>
                    <ReminderScheduleFields
                        slots={draftSlots}
                        onChange={setDraftSlots}
                        disabled={busyKey === "reminderSchedule"}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            className="w-full"
                            disabled={busyKey === "reminderSchedule"}
                            onClick={() => void handleScheduleSave()}
                        >
                            {UI.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
