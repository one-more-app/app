import {
  removeTrackedExerciseAndWait,
} from "@/lib/storage";
import {
  useHomeExercisesData,
  useTrackedDataRefresh,
} from "@/hooks/use-api-data";
import type { PerformanceEntry, TrackedExercise } from "@/types";
import { useCallback } from "react";

export interface ExerciseWithPerf extends TrackedExercise {
  lastPerf: PerformanceEntry | null;
  personalBest: PerformanceEntry | null;
}

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
