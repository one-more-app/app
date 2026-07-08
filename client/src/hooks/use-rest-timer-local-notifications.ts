import { useAuth } from "@/hooks/use-auth";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import {
  attachRestTimerLocalNotificationListeners,
  cancelRestFinishedLocalNotification,
  syncRestFinishedLocalNotification,
  type RestFinishedLocalNotificationParams,
} from "@/lib/rest-timer-local-notifications";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useMemo } from "react";

/**
 * Resynchronise la notif locale planifiée quand la dernière perf ou la
 * durée cible change, et écoute le tap sur la notif système.
 *
 * Planifiée dès l'enregistrement de la perf (alarme OS à createdAt + targetMs).
 * Premier plan : toast in-app ; la notif est annulée au retour foreground
 * et quand le toast se déclenche (iOS silent évite la bannière si encore active).
 * Arrière-plan : l'alarme déjà enregistrée fire à l'heure exacte.
 */
export function useRestTimerLocalNotifications() {
  const auth = useAuth();
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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;
    return attachRestTimerLocalNotificationListeners();
  }, [auth.status]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;
    void syncRestFinishedLocalNotification(notificationParams);
  }, [auth.status, notificationParams]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (auth.status !== "authenticated") return;

    const handle = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void cancelRestFinishedLocalNotification();
        return;
      }
      void syncRestFinishedLocalNotification(notificationParams);
    });

    return () => {
      void handle.then((h) => h.remove());
    };
  }, [auth.status, notificationParams]);
}
