import { useGymNotificationsReady } from "@/hooks/use-gym-notifications-ready";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import {
  attachRestTimerLocalNotificationListeners,
  setRestTimerLifecycleEnabled,
  updateRestTimerNotificationParams,
  type RestFinishedLocalNotificationParams,
} from "@/lib/rest-timer-local-notifications";
import { useGymOnboardingBlocksFeatures } from "@/hooks/use-user-gym-data";
import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo } from "react";

function buildParamsKey(
  params: RestFinishedLocalNotificationParams | null,
): string {
  if (!params) return "";
  return `${params.exerciseId}:${params.createdAt}:${params.targetMs}`;
}

/**
 * Resynchronise la notif locale planifiée quand la dernière perf ou la
 * durée cible change, et écoute le tap sur la notif système.
 */
export function useRestTimerLocalNotifications() {
  const notificationsReady = useGymNotificationsReady();
  const gymOnboardingActive = useGymOnboardingBlocksFeatures();
  const lifecycleActive = notificationsReady && !gymOnboardingActive;
  const latestGlobalPerf = useLatestGlobalPerf();
  const { targetMs } = useRestTargetMs();

  const notificationParams = useMemo((): RestFinishedLocalNotificationParams | null => {
    const entry = latestGlobalPerf?.entry;
    const exercise = latestGlobalPerf?.exercise;
    if (!entry || !exercise?.id) return null;
    return {
      createdAt: entry.createdAt,
      targetMs,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    };
  }, [
    latestGlobalPerf?.entry?.createdAt,
    latestGlobalPerf?.entry?.id,
    latestGlobalPerf?.exercise?.id,
    latestGlobalPerf?.exercise?.name,
    targetMs,
  ]);

  const paramsKey = buildParamsKey(notificationParams);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    setRestTimerLifecycleEnabled(lifecycleActive);
    return () => {
      setRestTimerLifecycleEnabled(false);
    };
  }, [lifecycleActive]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!lifecycleActive) return;
    return attachRestTimerLocalNotificationListeners();
  }, [lifecycleActive]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!lifecycleActive) return;
    updateRestTimerNotificationParams(notificationParams);
  }, [lifecycleActive, paramsKey, notificationParams]);
}
