import {
  usePerformanceEntriesData,
  useUserProgressData,
} from "@/hooks/use-api-data";
import {
  useLocalPerformanceEntries,
  useLocalUserProgress,
} from "@/hooks/use-local-data-store";
import {
  buildProfileActivityView,
  mergePerformanceEntriesById,
} from "@/lib/activity-from-performances";
import { useMemo } from "react";

/**
 * Données du bloc « Activité » du profil.
 *
 * - Calendrier et jours actifs : dérivés des performances (cache local + SWR).
 * - Série : progression serveur (SWR + cache local après une perf) ou recalcul depuis les perfs.
 */
export function useProfileActivity(month: string) {
  const {
    data: remoteEntries = [],
    isLoading: remoteEntriesLoading,
  } = usePerformanceEntriesData();
  const { data: remoteProgress, isLoading: remoteProgressLoading } =
    useUserProgressData();
  const localEntries = useLocalPerformanceEntries();
  const localProgress = useLocalUserProgress();

  const entries = useMemo(
    () => mergePerformanceEntriesById(remoteEntries, localEntries),
    [remoteEntries, localEntries],
  );

  const progressStreak = useMemo(
    () => ({
      current: Math.max(
        remoteProgress?.streak.current ?? 0,
        localProgress.streak.current,
      ),
      longest: Math.max(
        remoteProgress?.streak.longest ?? 0,
        localProgress.streak.longest,
      ),
    }),
    [remoteProgress, localProgress],
  );

  const view = useMemo(
    () => buildProfileActivityView(month, entries, { streak: progressStreak }),
    [month, entries, progressStreak],
  );

  const isLoading =
    (remoteEntriesLoading && entries.length === 0) ||
    (remoteProgressLoading && remoteProgress == null && progressStreak.current === 0);

  return { view, isLoading, entries };
}
