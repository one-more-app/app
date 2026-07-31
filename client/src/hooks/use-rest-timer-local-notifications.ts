import { useAuth } from "@/hooks/use-auth";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import { useRestTimerEnabled } from "@/hooks/use-rest-timer-enabled";
import {
  isCelebrationUiBusy,
  whenCelebrationUiIdle,
} from "@/lib/celebration-queue";
import {
  setRestTimerLifecycleEnabled,
  forceUpdateRestTimerNotificationParams,
  attachRestTimerLocalNotificationListeners,
  type RestFinishedLocalNotificationParams,
} from "@/lib/rest-timer-local-notifications";
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
  const auth = useAuth();
  const { enabled: restTimerEnabled } = useRestTimerEnabled();
  // Indépendant de l'onboarding salle / push gym : le repos doit marcher même sans salle.
  const lifecycleActive =
    Capacitor.isNativePlatform() &&
    auth.status === "authenticated" &&
    restTimerEnabled;
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
    if (!lifecycleActive) return;

    const applyParams = () => {
      forceUpdateRestTimerNotificationParams(notificationParams);
    };

    // First-perf : pas de RestTimer pendant hold/célébration (freeze Continuer iOS).
    if (isCelebrationUiBusy()) {
      whenCelebrationUiIdle(applyParams);
      return;
    }
    applyParams();
  }, [lifecycleActive, paramsKey, notificationParams]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    return () => {
      setRestTimerLifecycleEnabled(false);
    };
  }, []);
}

/** Écoute le tap sur la notif repos fini (toujours actif sur natif). */
export function useRestTimerNotificationTap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    return attachRestTimerLocalNotificationListeners();
  }, []);
}
