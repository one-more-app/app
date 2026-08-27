import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { hapticImpact } from "@/lib/haptics";
import {
  isPushPermissionGranted,
  registerPushIfPermitted,
  requestPushPermission,
} from "@/lib/push-notifications";
import {
  isHomeNotificationsPromptDone,
  isHomeNotificationsPromptPending,
  isHomeTourComplete,
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  setHomeNotificationsPromptDone,
  subscribeHomeTourComplete,
} from "@/lib/storage";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef } from "react";

const OPEN_DELAY_MS = 400;

function canPromptAfterTours(): boolean {
  if (!isHomeTourComplete()) return false;
  if (!isHomeNotificationsPromptPending()) return false;
  if (isHomeNotificationsPromptDone()) return false;
  if (isOnboardingFirstExercisePending() && !isOnboardingTourComplete()) {
    return false;
  }
  return true;
}

export function HomeNotificationsPrompt() {
  const auth = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfileData();
  const promptingRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let delayId: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      window.clearTimeout(delayId);
      delayId = setTimeout(() => {
        void (async () => {
          if (cancelled || promptingRef.current) return;
          if (auth.status !== "authenticated") return;
          if (profileLoading) return;
          if (profile && !profile.username?.trim()) return;
          if (!canPromptAfterTours()) return;
          if (await isPushPermissionGranted()) {
            if (cancelled) return;
            setHomeNotificationsPromptDone(true);
            return;
          }
          if (cancelled) return;

          promptingRef.current = true;
          try {
            const granted = await requestPushPermission();
            if (granted) {
              await registerPushIfPermitted();
              void hapticImpact();
            }
            track(
              granted
                ? AnalyticsEvents.PUSH_NOTIFICATION_ENABLED
                : AnalyticsEvents.PUSH_NOTIFICATION_DISABLED,
              { source: "home_tour_prompt" },
            );
            setHomeNotificationsPromptDone(true);
          } finally {
            promptingRef.current = false;
          }
        })();
      }, OPEN_DELAY_MS);
    };

    run();
    const unsubscribe = subscribeHomeTourComplete(run);

    return () => {
      cancelled = true;
      window.clearTimeout(delayId);
      unsubscribe();
    };
  }, [auth.status, profile, profileLoading]);

  return null;
}
