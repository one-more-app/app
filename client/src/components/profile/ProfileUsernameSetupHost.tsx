import { ProfileUsernameSetupDialog } from "@/components/profile/ProfileUsernameSetupDialog";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfileData } from "@/hooks/use-api-data";
import { fetchTrackedExercises } from "@/lib/data-api";
import { hasVisibleTrackedExercise } from "@/lib/post-auth-navigation";
import {
  isExerciseCatalogTourComplete,
  isExerciseDetailTourComplete,
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  isRestCounterTourComplete,
  subscribeExerciseCatalogTourComplete,
  subscribeExerciseDetailTourComplete,
  subscribeRestCounterTourComplete,
} from "@/lib/storage";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/** Survit aux remontages React Strict Mode pour éviter le double flash. */
type UsernamePromptLatch = {
  userId: string | null;
  profileSettled: boolean;
  tourAllowsPrompt: boolean | null;
};

const promptLatch: UsernamePromptLatch = {
  userId: null,
  profileSettled: false,
  tourAllowsPrompt: null,
};

function syncPromptLatchUser(userId: string | null): void {
  if (promptLatch.userId === userId) return;
  promptLatch.userId = userId;
  promptLatch.profileSettled = false;
  promptLatch.tourAllowsPrompt = null;
}

function isPageFirstTimeTourPending(pathname: string): boolean {
  if (pathname === "/exercises") {
    return !isExerciseCatalogTourComplete();
  }
  if (pathname.startsWith("/exercise/")) {
    if (!isExerciseDetailTourComplete()) return true;
    return (
      !isRestCounterTourComplete() &&
      typeof document !== "undefined" &&
      Boolean(document.querySelector('[data-tour="rest-counter"]'))
    );
  }
  return false;
}

function resolveTourGateSync(): boolean {
  if (promptLatch.tourAllowsPrompt !== null) {
    return promptLatch.tourAllowsPrompt;
  }
  if (isOnboardingTourComplete()) {
    promptLatch.tourAllowsPrompt = true;
    return true;
  }
  if (isOnboardingFirstExercisePending()) {
    promptLatch.tourAllowsPrompt = false;
    return false;
  }
  return false;
}

/** Modal pseudo obligatoire sur toute l'app une fois le tutoriel terminé. */
export function ProfileUsernameSetupHost() {
  const auth = useAuth();
  const location = useLocation();
  const userId = auth.user?.id ?? null;
  syncPromptLatchUser(userId);

  const { data: profile, isValidating } = useUserProfileData();
  const [gateVersion, setGateVersion] = useState(0);
  const [pageTourPending, setPageTourPending] = useState(() =>
    isPageFirstTimeTourPending(location.pathname),
  );
  const tourFetchStartedRef = useRef(false);

  const isAuthenticated = auth.status === "authenticated";
  const hasUsername = Boolean(profile?.username?.trim());

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isValidating || promptLatch.profileSettled) return;
    promptLatch.profileSettled = true;
    setGateVersion((v) => v + 1);
  }, [isAuthenticated, isValidating]);

  useEffect(() => {
    if (!isAuthenticated || !promptLatch.profileSettled || hasUsername) return;
    if (promptLatch.tourAllowsPrompt !== null) return;

    if (resolveTourGateSync()) {
      setGateVersion((v) => v + 1);
      return;
    }
    if (promptLatch.tourAllowsPrompt === false) {
      setGateVersion((v) => v + 1);
      return;
    }

    if (tourFetchStartedRef.current) return;
    tourFetchStartedRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const tracked = await fetchTrackedExercises();
        if (cancelled || promptLatch.tourAllowsPrompt !== null) return;
        const allows = hasVisibleTrackedExercise(tracked);
        promptLatch.tourAllowsPrompt = allows;
        setGateVersion((v) => v + 1);
      } catch {
        if (!cancelled && promptLatch.tourAllowsPrompt === null) {
          promptLatch.tourAllowsPrompt = false;
          setGateVersion((v) => v + 1);
        }
      } finally {
        tourFetchStartedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasUsername, gateVersion]);

  useEffect(() => {
    const sync = () => {
      setPageTourPending(isPageFirstTimeTourPending(location.pathname));
    };
    sync();
    const unsubCatalog = subscribeExerciseCatalogTourComplete(sync);
    const unsubDetail = subscribeExerciseDetailTourComplete(sync);
    const unsubRest = subscribeRestCounterTourComplete(sync);
    return () => {
      unsubCatalog();
      unsubDetail();
      unsubRest();
    };
  }, [location.pathname]);

  const showUsernameSetup =
    isAuthenticated &&
    promptLatch.profileSettled &&
    !hasUsername &&
    promptLatch.tourAllowsPrompt === true &&
    !pageTourPending;

  if (!showUsernameSetup) return null;

  return <ProfileUsernameSetupDialog />;
}
