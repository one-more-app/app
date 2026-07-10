import { GymOnboardingPermissionRow } from "@/components/onboarding/GymOnboardingPermissionRow";
import { GymChangeDialog } from "@/components/settings/GymChangeDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutateUserGym, useUserGymData } from "@/hooks/use-user-gym-data";
import { subscribeAppStateChange } from "@/lib/app-state-listener";
import {
    getGymGeofencePermissions,
    GymGeofencePermissionError,
    openGymGeofenceSettings,
    promptGymGeofenceLocationAccess,
    registerGymGeofence,
    registerGymGeofenceIfPermitted,
    unregisterGymGeofence,
} from "@/lib/gym-geofence";
import { deleteUserGym, upsertUserGym } from "@/lib/gyms-api";
import { isGymPermissionsDevWebPreview } from "@/lib/onboarding-gym-dev";
import {
    isPushPermissionGranted,
    registerPushIfPermitted,
    requestPushPermission,
} from "@/lib/push-notifications";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { Bell, Loader2, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

export function GymSettingsCard() {
    const location = useLocation();
    const { data: gym, isLoading: loading } = useUserGymData();
    const mutateUserGym = useMutateUserGym();
    const isNative = Capacitor.isNativePlatform();
    const isDevWebPreview = isGymPermissionsDevWebPreview();

    const [pickerOpen, setPickerOpen] = useState(false);

    const [notificationsOn, setNotificationsOn] = useState(false);
    const [locationOn, setLocationOn] = useState(false);
    const [busyNotifications, setBusyNotifications] = useState(false);
    const [busyLocation, setBusyLocation] = useState(false);
    const [geofenceNeedsSettings, setGeofenceNeedsSettings] = useState(false);
    const wasBackgroundedRef = useRef(false);

    const registerGeofenceOrNotify = useCallback(async (saved: NonNullable<typeof gym>) => {
        setGeofenceNeedsSettings(false);
        try {
            await registerGymGeofence({
                lat: saved.lat,
                lng: saved.lng,
                radiusM: saved.radiusM,
                gymName: saved.name,
                onboardingGymPending: saved.onboardingGymPending,
            });
        } catch (err) {
            if (err instanceof GymGeofencePermissionError) {
                toast.error(UI.gymGeofencePermissionsDenied);
                setGeofenceNeedsSettings(err.needsSettings);
                return;
            }
            throw err;
        }
    }, []);

    const syncGeofenceEnabled = useCallback(
        async (enabled: boolean) => {
            if (!gym) return null;
            const saved = await upsertUserGym({
                ...gym,
                geofenceEnabled: enabled,
            });
            await mutateUserGym();
            if (!isNative) return saved;
            if (enabled) {
                await registerGeofenceOrNotify(saved);
            } else {
                setGeofenceNeedsSettings(false);
                await unregisterGymGeofence();
            }
            return saved;
        },
        [gym, isNative, mutateUserGym, registerGeofenceOrNotify],
    );

    const refreshPermissionState = useCallback(async () => {
        setBusyLocation(false);
        const pushGranted = await isPushPermissionGranted();
        if (pushGranted) {
            await registerPushIfPermitted();
        }
        setNotificationsOn(pushGranted);

        if (!isNative) {
            setLocationOn(false);
            return;
        }

        const locationStatus = await getGymGeofencePermissions();
        const geofenceReady = locationStatus.ready && (gym?.geofenceEnabled ?? false);
        if (geofenceReady && gym?.geofenceEnabled) {
            await registerGymGeofenceIfPermitted({
                lat: gym.lat,
                lng: gym.lng,
                radiusM: gym.radiusM,
                gymName: gym.name,
                onboardingGymPending: gym.onboardingGymPending,
            });
            setLocationOn(true);
            setGeofenceNeedsSettings(false);
        } else {
            setLocationOn(false);
            setGeofenceNeedsSettings(locationStatus.needsSettings);
        }
    }, [gym, isNative]);

    useEffect(() => {
        if (!gym) return;
        void refreshPermissionState();
    }, [gym, refreshPermissionState, location.pathname]);

    useEffect(() => {
        if (!isNative) return;

        return subscribeAppStateChange((isActive) => {
            if (!isActive) {
                wasBackgroundedRef.current = true;
                return;
            }
            if (!wasBackgroundedRef.current) return;
            void refreshPermissionState();
        });
    }, [isNative, refreshPermissionState]);

    const openGymPicker = () => {
        setPickerOpen(true);
    };

    const handleGymSaved = async () => {
        await mutateUserGym();
        toast.success(UI.gymSettingsSaved);
    };

    const handleNotificationsToggle = async (checked: boolean) => {
        if (!checked || busyNotifications) {
            setNotificationsOn(false);
            return;
        }
        if (isDevWebPreview) {
            setNotificationsOn(true);
            return;
        }
        setBusyNotifications(true);
        try {
            const granted = await requestPushPermission();
            if (granted) {
                await registerPushIfPermitted();
            }
            setNotificationsOn(granted);
        } finally {
            setBusyNotifications(false);
        }
    };

    const handleLocationToggle = async (checked: boolean) => {
        if (!gym || busyLocation) return;
        if (!checked) {
            setLocationOn(false);
            try {
                await syncGeofenceEnabled(false);
            } catch {
                toast.error(UI.gymSettingsUpdateError);
            }
            return;
        }
        if (isDevWebPreview) {
            setLocationOn(true);
            return;
        }
        if (!isNative) {
            setLocationOn(false);
            return;
        }
        setBusyLocation(true);
        setGeofenceNeedsSettings(false);
        try {
            const { status } = await promptGymGeofenceLocationAccess({
                preferSettings: geofenceNeedsSettings,
            });
            if (!status.ready) {
                setLocationOn(false);
                setGeofenceNeedsSettings(status.needsSettings);
                return;
            }
            await syncGeofenceEnabled(true);
            setLocationOn(true);
            setGeofenceNeedsSettings(false);
        } catch {
            toast.error(UI.gymSettingsUpdateError);
            setLocationOn(false);
        } finally {
            setBusyLocation(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm(UI.gymSettingsRemoveConfirm)) return;
        try {
            await deleteUserGym();
            if (isNative) await unregisterGymGeofence();
            await mutateUserGym();
            setNotificationsOn(false);
            setLocationOn(false);
            toast.success(UI.gymSettingsRemoved);
        } catch {
            toast.error(UI.gymSettingsRemoveError);
        }
    };

    const allRemindersActive = isNative
        ? notificationsOn && locationOn
        : notificationsOn;
    const showRemindersBlock = Boolean(gym) && !allRemindersActive;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{UI.gymSettingsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card id="gym-settings">
            <CardHeader>
                <CardTitle>{UI.gymSettingsTitle}</CardTitle>
                <p className="text-sm text-muted-foreground">{UI.gymSettingsDescription}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {!gym ? (
                    <p className="text-sm text-muted-foreground">{UI.gymSettingsEmpty}</p>
                ) : (
                    <div className="rounded-xl border border-border/60 px-3 py-3">
                        <p className="font-medium">{gym.name}</p>
                        {gym.address ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">{gym.address}</p>
                        ) : (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {UI.gymSettingsSearchNoAddress}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="flex-1" onClick={openGymPicker}>
                        {gym ? UI.gymSettingsChange : UI.gymSettingsAdd}
                    </Button>
                    {gym ? (
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => void handleRemove()}
                        >
                            {UI.gymSettingsRemove}
                        </Button>
                    ) : null}
                </div>

                {showRemindersBlock ? (
                    <div className="space-y-2 border-t border-border/60 pt-4">
                        <div>
                            <p className="font-one-more text-xs font-semibold uppercase italic tracking-wide text-foreground">
                                {UI.gymSettingsRemindersSection}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {UI.gymSettingsRemindersPending}
                            </p>
                        </div>
                        <div className="space-y-2">
                            {!notificationsOn ? (
                                <GymOnboardingPermissionRow
                                    icon={Bell}
                                    label={UI.gymOnboardingPermissionsNotificationsLabel}
                                    hint={UI.gymOnboardingPermissionsNotificationsHint}
                                    checked={notificationsOn}
                                    busy={busyNotifications}
                                    onCheckedChange={(checked) => void handleNotificationsToggle(checked)}
                                />
                            ) : null}
                            {(isNative || isDevWebPreview) && !locationOn ? (
                                <GymOnboardingPermissionRow
                                    icon={MapPin}
                                    label={UI.gymOnboardingPermissionsLocationLabel}
                                    hint={UI.gymOnboardingPermissionsLocationHint}
                                    checked={locationOn}
                                    busy={busyLocation}
                                    onCheckedChange={(checked) => void handleLocationToggle(checked)}
                                />
                            ) : null}
                            {geofenceNeedsSettings ? (
                                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                                    <p className="text-sm text-muted-foreground">
                                        {UI.gymOnboardingLocationDenied}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {UI.gymOnboardingLocationSettingsHint}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => void openGymGeofenceSettings()}
                                    >
                                        {UI.gymOnboardingLocationSettingsCta}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </CardContent>

            <GymChangeDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                hasGym={Boolean(gym)}
                onSaved={() => void handleGymSaved()}
            />
        </Card>
    );
}
