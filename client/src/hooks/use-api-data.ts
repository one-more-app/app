import { useAuth } from "@/hooks/use-auth";
import {
  fetchPerformanceEntries,
  fetchRemoteProfile,
  fetchTrackedExercises,
  fetchTrackedExercisesWithPerformance,
  fetchUserActivityMonth,
  fetchUserProgress,
  type TrackedExerciseWithPerformance,
} from "@/lib/data-api";
import { getUserProgress, setUserProgress } from "@/lib/progress-cache";
import {
  setPerformanceEntries,
  setTrackedExercises,
  setUserProfile,
} from "@/lib/storage";
import type {
  PerformanceEntry,
  TrackedExercise,
  UserProfile,
  UserActivityMonth,
  UserProgressState,
} from "@/types";
import useSWR from "swr";
import { useCallback } from "react";
import { useSWRConfig } from "swr";

export const SWR_KEYS = {
  trackedExercises: "tracked-exercises",
  performanceEntries: "performance-entries",
  profile: "profile",
  homeExercises: "home-exercises",
  progress: "progress",
  activityMonthPrefix: "progress-activity",
  activityMonth: (month: string) => ["progress-activity", month] as const,
} as const;

function isActivityMonthKey(key: unknown): boolean {
  return Array.isArray(key) && key[0] === SWR_KEYS.activityMonthPrefix;
}

export function usePerformanceDataRefresh() {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    await Promise.all([
      mutate(SWR_KEYS.performanceEntries),
      mutate(SWR_KEYS.homeExercises),
      mutate(SWR_KEYS.trackedExercises),
      mutate(SWR_KEYS.progress),
      mutate(isActivityMonthKey),
    ]);
  }, [mutate]);
}

export function useProgressDataRefresh() {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    await Promise.all([
      mutate(SWR_KEYS.progress),
      mutate(isActivityMonthKey),
    ]);
  }, [mutate]);
}

export function useUserActivityData(month: string) {
  const auth = useAuth();
  return useSWR<UserActivityMonth>(
    auth.status === "authenticated" && month
      ? SWR_KEYS.activityMonth(month)
      : null,
    () => fetchUserActivityMonth(month),
  );
}

export function useTrackedDataRefresh() {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    await Promise.all([
      mutate(SWR_KEYS.trackedExercises),
      mutate(SWR_KEYS.homeExercises),
      mutate(SWR_KEYS.performanceEntries),
    ]);
  }, [mutate]);
}

export function useProfileDataRefresh() {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    await mutate(SWR_KEYS.profile);
  }, [mutate]);
}

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  heightCm: 175,
  gender: "male",
};

export function useTrackedExercisesData() {
  const auth = useAuth();
  return useSWR<TrackedExercise[]>(
    auth.status === "authenticated" ? SWR_KEYS.trackedExercises : null,
    async () => {
      const list = await fetchTrackedExercises({ includeDeleted: true });
      setTrackedExercises(list);
      return list;
    },
  );
}

export function usePerformanceEntriesData() {
  const auth = useAuth();
  return useSWR<PerformanceEntry[]>(
    auth.status === "authenticated" ? SWR_KEYS.performanceEntries : null,
    async () => {
      const list = await fetchPerformanceEntries({ includeDeleted: true });
      setPerformanceEntries(list);
      return list;
    },
  );
}

export function useHomeExercisesData() {
  const auth = useAuth();
  return useSWR<TrackedExerciseWithPerformance[]>(
    auth.status === "authenticated" ? SWR_KEYS.homeExercises : null,
    async () => {
      const list = await fetchTrackedExercisesWithPerformance();
      setTrackedExercises(list);
      return list;
    },
  );
}

export function useUserProgressData() {
  const auth = useAuth();
  return useSWR<UserProgressState>(
    auth.status === "authenticated" ? SWR_KEYS.progress : null,
    async () => {
      const remote = await fetchUserProgress();
      setUserProgress(remote);
      return remote;
    },
    {
      fallbackData: getUserProgress(),
    },
  );
}

export function useUserProfileData() {
  const auth = useAuth();
  return useSWR<UserProfile>(
    auth.status === "authenticated" ? SWR_KEYS.profile : null,
    async () => {
      const remote = await fetchRemoteProfile();
      const profile: UserProfile = remote
        ? {
            weightKg: remote.weightKg,
            heightCm: remote.heightCm,
            gender: remote.gender,
            firstName: remote.firstName ?? undefined,
            lastName: remote.lastName ?? undefined,
          }
        : DEFAULT_PROFILE;
      setUserProfile(profile, { silent: true });
      return profile;
    },
    {
      fallbackData: DEFAULT_PROFILE,
    },
  );
}
