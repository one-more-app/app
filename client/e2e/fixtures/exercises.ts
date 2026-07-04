import type { ExerciseDBExercise } from "@/types";

export const e2eCatalogExercise: ExerciseDBExercise = {
  id: "e2e-bench-press",
  name: "bench press",
  bodyPart: "chest",
  target: "pectorals",
  equipment: "barbell",
  gifUrl: "",
  secondaryMuscles: [],
  instructions: [],
};

export const e2eTrackedId = `api-${e2eCatalogExercise.id}`;

export function buildTrackedExercise() {
  const now = new Date().toISOString();
  return {
    id: e2eTrackedId,
    exerciseId: e2eCatalogExercise.id,
    name: e2eCatalogExercise.name,
    originalName: e2eCatalogExercise.name,
    bodyPart: e2eCatalogExercise.bodyPart,
    target: e2eCatalogExercise.target,
    equipment: e2eCatalogExercise.equipment,
    gifUrl: e2eCatalogExercise.gifUrl,
    isCustom: false,
    updatedAt: now,
    deletedAt: null as string | null,
  };
}
