import { RestTimeFinishedToastContent } from "@/components/RestTimeFinishedToast";
import { useAuth } from "@/hooks/use-auth";
import { useGymNotificationsReady } from "@/hooks/use-gym-notifications-ready";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import {
  getRestElapsedMs,
  isRestSinceLastSetVisible,
  isRestTargetComplete,
} from "@/lib/format-rest-elapsed";
import { cancelRestFinishedLocalNotification } from "@/lib/rest-timer-local-notifications";
import { hapticNotificationSuccess } from "@/lib/haptics";
import { playRestFinishedSound } from "@/lib/milestone-sound";
import { useGymOnboardingBlocksFeatures } from "@/hooks/use-user-gym-data";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const REST_FINISHED_TOAST_CLASS_NAMES = {
  toast: cn(
    "group toast font-sans",
    "w-[min(calc(100vw-2rem),20rem)]",
    "!rounded-xl !border !border-border !bg-card/95 !p-0",
    "!text-card-foreground",
    "!shadow-sm shadow-black/10",
    "dark:!shadow-md dark:shadow-black/35",
    "!backdrop-blur-md",
  ),
  content: "!m-0 w-full font-sans",
  title: "!m-0 w-full !font-normal !leading-normal font-sans",
};

function showRestTimeFinishedToast(params: {
  exerciseName: string;
  onOpen: () => void;
}): void {
  toast.custom(
    (toastId) => (
      <RestTimeFinishedToastContent
        toastId={toastId}
        exerciseName={params.exerciseName}
        onOpen={params.onOpen}
      />
    ),
    {
      duration: 6000,
      unstyled: true,
      classNames: REST_FINISHED_TOAST_CLASS_NAMES,
    },
  );
}

/**
 * Surveille la fin du repos globalement (toutes pages) et affiche
 * un toast cliquable avec le nom de l'exercice source.
 */
export function RestTimeFinishedToastHost() {
  const auth = useAuth();
  const notificationsReady = useGymNotificationsReady();
  const gymOnboardingActive = useGymOnboardingBlocksFeatures();
  const hostActive =
    auth.status === "authenticated" &&
    notificationsReady &&
    !gymOnboardingActive;
  const navigate = useNavigate();
  const latestGlobalPerf = useLatestGlobalPerf();
  const { targetMs } = useRestTargetMs();
  const [now, setNow] = useState(() => Date.now());
  const notifiedForCreatedAtRef = useRef<string | null>(null);

  const createdAt = latestGlobalPerf?.entry.createdAt ?? null;
  const exercise = latestGlobalPerf?.exercise ?? null;

  useEffect(() => {
    if (!hostActive || !createdAt) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tickNow = () => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (!isRestSinceLastSetVisible(createdAt, currentNow) && intervalId != null) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const startInterval = () => {
      if (intervalId != null) return;
      intervalId = setInterval(tickNow, 1000);
    };

    const stopInterval = () => {
      if (intervalId == null) return;
      clearInterval(intervalId);
      intervalId = undefined;
    };

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isRestSinceLastSetVisible(createdAt)
      ) {
        setNow(Date.now());
        startInterval();
      } else {
        stopInterval();
      }
    };

    if (document.visibilityState === "visible") {
      startInterval();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hostActive, createdAt]);

  useEffect(() => {
    if (!hostActive || !createdAt || !exercise?.id) return;

    const elapsedMs = getRestElapsedMs(createdAt, now);
    if (elapsedMs == null) return;
    if (!isRestSinceLastSetVisible(createdAt, now)) return;
    if (!isRestTargetComplete(elapsedMs, targetMs)) return;
    if (notifiedForCreatedAtRef.current === createdAt) return;

    notifiedForCreatedAtRef.current = createdAt;
    void cancelRestFinishedLocalNotification();
    showRestTimeFinishedToast({
      exerciseName: exercise.name,
      onOpen: () => navigate(`/exercise/${exercise.id}`),
    });
    playRestFinishedSound();
    void hapticNotificationSuccess();
  }, [hostActive, createdAt, exercise, now, navigate, targetMs]);

  return null;
}
