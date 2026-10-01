import { GymOnboardingPermissionRow } from "@/components/onboarding/GymOnboardingPermissionRow";
import { Button } from "@/components/ui/button";
import { subscribeAppStateChange } from "@/lib/app-state-listener";
import {
  getGymGeofencePermissions,
  openGymGeofenceSettings,
  promptGymGeofenceLocationAccess,
  registerGymGeofenceIfPermitted,
} from "@/lib/gym-geofence";
import { fetchUserGym } from "@/lib/gyms-api";
import { isGymPermissionsDevWebPreview } from "@/lib/onboarding-gym-dev";
import {
  isPushPermissionGranted,
  registerPushIfPermitted,
  requestPushPermission,
} from "@/lib/push-notifications";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { Bell, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export async function needsGymArrivalPermissions(): Promise<boolean> {
  const pushGranted = await isPushPermissionGranted();
  if (!pushGranted) return true;

  const isNative = Capacitor.isNativePlatform();
  if (!isNative) return false;

  const locationStatus = await getGymGeofencePermissions();
  return !locationStatus.ready;
}

type GymArrivalPermissionsPromptProps = {
  onDone: () => void;
};

export function GymArrivalPermissionsPrompt({
  onDone,
}: GymArrivalPermissionsPromptProps) {
  const isNative = Capacitor.isNativePlatform();
  const isDevWebPreview = isGymPermissionsDevWebPreview();
  const showLocationRow = isNative || isDevWebPreview;

  const [notificationsOn, setNotificationsOn] = useState(false);
  const [locationOn, setLocationOn] = useState(false);
  const [busyNotifications, setBusyNotifications] = useState(false);
  const [busyLocation, setBusyLocation] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const wasBackgroundedRef = useRef(false);

  const registerGeofenceFromApi = useCallback(async () => {
    const gym = await fetchUserGym();
    if (!gym?.geofenceEnabled) return;
    await registerGymGeofenceIfPermitted({
      lat: gym.lat,
      lng: gym.lng,
      radiusM: gym.radiusM,
      gymName: gym.name,
      onboardingGymPending: gym.onboardingGymPending,
    });
  }, []);

  const refreshPermissionState = useCallback(async () => {
    setBusyLocation(false);
    const pushGranted = await isPushPermissionGranted();
    if (pushGranted) {
      await registerPushIfPermitted();
    }
    setNotificationsOn(pushGranted);

    if (!isNative) {
      setLocationOn(false);
      setShowLocationSettings(false);
      return;
    }

    const locationStatus = await getGymGeofencePermissions();
    if (locationStatus.ready) {
      await registerGeofenceFromApi();
      setLocationOn(true);
      setShowLocationSettings(false);
    } else {
      setLocationOn(false);
      setShowLocationSettings(locationStatus.needsSettings);
    }
  }, [isNative, registerGeofenceFromApi]);

  useEffect(() => {
    wasBackgroundedRef.current = false;
    void refreshPermissionState();
  }, [refreshPermissionState]);

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

  const allReady = notificationsOn && (!showLocationRow || locationOn);
  const doneOnceRef = useRef(false);

  useEffect(() => {
    if (!allReady || doneOnceRef.current) return;
    doneOnceRef.current = true;
    onDone();
  }, [allReady, onDone]);

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
    if (!checked || busyLocation) {
      setLocationOn(false);
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
    setShowLocationSettings(false);
    try {
      const { status } = await promptGymGeofenceLocationAccess({
        preferSettings: showLocationSettings,
      });
      if (status.ready) {
        await registerGeofenceFromApi();
        setLocationOn(true);
        setShowLocationSettings(false);
        return;
      }
      setLocationOn(false);
      setShowLocationSettings(status.needsSettings);
    } finally {
      setBusyLocation(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {showLocationRow
          ? UI.gymArrivalPermissionsBody
          : UI.gymArrivalPermissionsBodyWeb}
      </p>

      <div className="space-y-2">
        <GymOnboardingPermissionRow
          icon={Bell}
          label={UI.gymOnboardingPermissionsNotificationsLabel}
          hint={UI.gymOnboardingPermissionsNotificationsHint}
          checked={notificationsOn}
          busy={busyNotifications}
          analyticsLabel="gym_change_notifications_toggle"
          onCheckedChange={(checked) => void handleNotificationsToggle(checked)}
        />
        {showLocationRow ? (
          <GymOnboardingPermissionRow
            icon={MapPin}
            label={UI.gymOnboardingPermissionsLocationLabel}
            hint={UI.gymOnboardingPermissionsLocationHint}
            checked={locationOn}
            busy={busyLocation}
            analyticsLabel="gym_change_location_toggle"
            onCheckedChange={(checked) => void handleLocationToggle(checked)}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            {UI.gymOnboardingWebOnly}
          </p>
        )}
      </div>

      {showLocationSettings ? (
        <div className="space-y-2 rounded-xl bg-secondary px-3 py-3">
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

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onDone}
      >
        {UI.gymArrivalPermissionsSkip}
      </Button>
    </div>
  );
}
