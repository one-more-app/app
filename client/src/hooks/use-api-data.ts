import { useAuth } from "@/hooks/use-auth";
import {
  fetchLeagueBrowseLookups,
  fetchLeagueSummary,
  fetchPerformanceEntries,
  fetchRemoteProfile,
  fetchTrackedExercises,
  fetchTrackedExercisesWithPerformance,
  fetchUserActivityMonth,
  fetchUserProgress,
  upsertRemoteProfile,
  type TrackedExerciseWithPerformance,
} from "@/lib/data-api";
import type { LeagueSummaryDto } from "@/lib/league-types";
import type { BrowseLeagueLookups } from "@one-more/shared/league-aggregate";
import { mergePerformanceEntriesById } from "@/lib/activity-from-performances";
import { getUserProgress, setUserProgress } from "@/lib/progress-cache";
import {
  getAllPerformanceEntries,
  getUserProfile,
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
  leagueSummary: "league-summary",
  leagueBrowse: "league-browse-lookups",
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
      mutate(SWR_KEYS.leagueSummary),
      mutate(SWR_KEYS.leagueBrowse),
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
      mutate(SWR_KEYS.leagueSummary),
      mutate(SWR_KEYS.leagueBrowse),
    ]);
  }, [mutate]);
}

export function useLeagueSummaryData() {
  const auth = useAuth();
  return useSWR<LeagueSummaryDto | null>(
    auth.status === "authenticated" ? SWR_KEYS.leagueSummary : null,
    () => fetchLeagueSummary(),
  );
}

export function useLeagueBrowseLookupsData() {
  const auth = useAuth();
  return useSWR<BrowseLeagueLookups>(
    auth.status === "authenticated" ? SWR_KEYS.leagueBrowse : null,
    () => fetchLeagueBrowseLookups(),
  );
}

export function useProfileDataRefresh() {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    await Promise.all([
      mutate(SWR_KEYS.profile),
      mutate(SWR_KEYS.leagueSummary),
      mutate(SWR_KEYS.leagueBrowse),
      mutate(SWR_KEYS.homeExercises),
    ]);
  }, [mutate]);
}


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

export function usePerformanceEntriesData(opts?: {
  withLeagueInsights?: boolean;
}) {
  const auth = useAuth();
  const withInsights = opts?.withLeagueInsights === true;
  return useSWR<PerformanceEntry[]>(
    auth.status === "authenticated"
      ? withInsights
        ? [...SWR_KEYS.performanceEntries, "insights"]
        : SWR_KEYS.performanceEntries
      : null,
    async () => {
      const remote = await fetchPerformanceEntries({
        includeDeleted: true,
        withLeagueInsights: withInsights,
      });
      const list = mergePerformanceEntriesById(
        remote,
        getAllPerformanceEntries(),
      );
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
      const local = getUserProgress();
      const merged: UserProgressState = {
        ...remote,
        streak: {
          current: remote.streak.current,
          longest: Math.max(
            remote.streak.longest,
            local.streak.longest,
          ),
        },
      };
      setUserProgress(merged);
      return merged;
    },
    {
      fallbackData: getUserProgress(),
    },
  );
}

function mergeRemoteProfile(
  remote: UserProfile | null,
  local: UserProfile,
): UserProfile {
  if (!remote) return local;
  return {
    weightKg: remote.weightKg,
    heightCm: remote.heightCm,
    gender: remote.gender,
    firstName: remote.firstName ?? local.firstName,
    lastName: remote.lastName ?? local.lastName,
    avatarUrl: remote.avatarUrl ?? local.avatarUrl,
    username: remote.username ?? local.username,
  };
}

export function useUserProfileData() {
  const auth = useAuth();
  return useSWR<UserProfile>(
    auth.status === "authenticated" ? SWR_KEYS.profile : null,
    async () => {
      const remote = await fetchRemoteProfile();
      const local = getUserProfile();
      const profile = mergeRemoteProfile(remote, local);
      const needsNameSync =
        remote &&
        (profile.firstName || profile.lastName) &&
        (!remote.firstName || !remote.lastName);
      setUserProfile(profile, { silent: true });
      if (needsNameSync) {
        void upsertRemoteProfile(profile).catch(() => {});
      }
      return profile;
    },
    {
      fallbackData: getUserProfile(),
    },
  );
}
