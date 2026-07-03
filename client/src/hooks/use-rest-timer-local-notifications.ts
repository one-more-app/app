import { useAuth } from "@/hooks/use-auth";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import {
  attachRestTimerLocalNotificationListeners,
  syncRestFinishedLocalNotification,
} from "@/lib/rest-timer-local-notifications";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";

/**
 * Resynchronise la notif locale planifiée quand la dernière perf ou la
 * durée cible change, et écoute le tap sur la notif système.
 */
export function useRestTimerLocalNotifications() {
  const auth = useAuth();
  const latestGlobalPerf = useLatestGlobalPerf();
  const { targetMs } = useRestTargetMs();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;
    return attachRestTimerLocalNotificationListeners();
  }, [auth.status]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;

    const entry = latestGlobalPerf?.entry;
    const exercise = latestGlobalPerf?.exercise;

    void syncRestFinishedLocalNotification(
      entry && exercise?.id
        ? {
            createdAt: entry.createdAt,
            targetMs,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
          }
        : null,
    );
  }, [
    auth.status,
    latestGlobalPerf?.entry.createdAt,
    latestGlobalPerf?.exercise?.id,
    latestGlobalPerf?.exercise?.name,
    targetMs,
  ]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;

    const handle = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) return;
      const entry = latestGlobalPerf?.entry;
      const exercise = latestGlobalPerf?.exercise;
      void syncRestFinishedLocalNotification(
        entry && exercise?.id
          ? {
              createdAt: entry.createdAt,
              targetMs,
              exerciseId: exercise.id,
              exerciseName: exercise.name,
            }
          : null,
      );
    });

    return () => {
      void handle.then((h) => h.remove());
    };
  }, [
    auth.status,
    latestGlobalPerf?.entry.createdAt,
    latestGlobalPerf?.exercise?.id,
    latestGlobalPerf?.exercise?.name,
    targetMs,
  ]);
}
