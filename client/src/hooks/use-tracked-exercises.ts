import {
  addTrackedExerciseAndWait as addStorageAndWait,
  removeTrackedExerciseAndWait as removeStorageAndWait,
} from "@/lib/storage";
import {
  useTrackedDataRefresh,
  useTrackedExercisesData,
} from "@/hooks/use-api-data";
import type { TrackedExercise } from "@/types";
import { useCallback, useMemo } from "react";

export function useTrackedExercises() {
  const { data = [] } = useTrackedExercisesData();
  const refreshAfterTrackedChange = useTrackedDataRefresh();
  const exercises = useMemo(
    () => data.filter((exercise) => !exercise.deletedAt),
    [data],
  );

  const addExercise = useCallback(
    async (exercise: Omit<TrackedExercise, "id">) => {
      const withId: TrackedExercise = {
        ...exercise,
        id: exercise.isCustom
          ? exercise.exerciseId
          : `api-${exercise.exerciseId}`,
      };
      await addStorageAndWait(withId);
      await refreshAfterTrackedChange();
    },
    [refreshAfterTrackedChange],
  );

  const removeExercise = useCallback(
    async (id: string) => {
      await removeStorageAndWait(id);
      await refreshAfterTrackedChange();
    },
    [refreshAfterTrackedChange],
  );

  return {
    exercises,
    addExercise,
    removeExercise,
    refresh: () => void refreshAfterTrackedChange(),
  };
}
