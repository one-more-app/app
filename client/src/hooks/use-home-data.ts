import {
  removeTrackedExerciseAndWait,
} from "@/lib/storage";
import {
  useHomeExercisesData,
  useTrackedDataRefresh,
} from "@/hooks/use-api-data";
import type { TrackedExerciseWithPerformance } from "@/lib/data-api";
import type { PerformanceEntry } from "@/types";
import { useCallback } from "react";

export type ExerciseWithPerf = TrackedExerciseWithPerformance;

export function useHomeData() {
  const {
    data: exercises = [],
    isLoading: isLoadingHome,
  } = useHomeExercisesData();
  const refreshAfterTrackedChange = useTrackedDataRefresh();

  const removeExercise = useCallback(
    async (id: string) => {
      await removeTrackedExerciseAndWait(id);
      await refreshAfterTrackedChange();
    },
    [refreshAfterTrackedChange],
  );

  const refresh = useCallback(() => {
    void refreshAfterTrackedChange();
  }, [refreshAfterTrackedChange]);

  return {
    exercises,
    hasLoaded: !isLoadingHome,
    removeExercise,
    refresh,
  };
}
