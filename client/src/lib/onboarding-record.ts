import { toast } from "sonner"
import { UI } from "@/lib/translations"
import {
  addTrackedExerciseAndWait,
  clearPendingOnboardingRecord,
  peekPendingOnboardingRecord,
  savePerformanceAndWait,
  setOnboardingFirstExercisePending,
  setOnboardingRecordDestination,
  setOnboardingTourComplete,
} from "@/lib/storage"

export async function commitPendingOnboardingRecord(): Promise<string | null> {
  const draft = peekPendingOnboardingRecord()
  if (!draft) return null

  const trackedId = draft.clientTrackedId
  try {
    await addTrackedExerciseAndWait({
      id: trackedId,
      exerciseId: draft.exerciseId,
      name: draft.name,
      originalName: draft.originalName,
      bodyPart: draft.bodyPart,
      target: draft.target,
      equipment: draft.equipment,
      isCustom: false,
    })
    await savePerformanceAndWait(trackedId, draft.weight, draft.reps, {
      skipRestTimer: true,
    })
    clearPendingOnboardingRecord()
  } catch {
    toast.message(UI.onboardingRecordSaveError)
  }

  setOnboardingFirstExercisePending(false)
  setOnboardingTourComplete(true)
  setOnboardingRecordDestination(`/exercise/${trackedId}`)
  return trackedId
}


