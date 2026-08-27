import { SWR_KEYS } from "@/hooks/use-api-data"
import { mergePerformanceEntriesById } from "@/lib/activity-from-performances"
import {
  fetchPerformanceEntries,
  fetchTrackedExercisesWithPerformance,
} from "@/lib/data-api"
import { onboardingExerciseGifUrl } from "@/lib/onboarding-starter-exercises"
import { UI } from "@/lib/translations"
import {
  addTrackedExerciseAndWait,
  clearPendingOnboardingRecord,
  getAllPerformanceEntries,
  peekPendingOnboardingRecord,
  savePerformanceAndWait,
  setOnboardingFirstExercisePending,
  setOnboardingRecordDestination,
  setOnboardingTourComplete,
  setPerformanceEntries,
  setTrackedExercises,
  type PendingOnboardingRecord,
} from "@/lib/storage"
import type { TrackedExercise } from "@/types"
import { toast } from "sonner"
import { mutate } from "swr"

export function trackedExerciseFromOnboardingDraft(
  draft: PendingOnboardingRecord,
): TrackedExercise {
  const gifUrl = draft.gifUrl?.trim() || onboardingExerciseGifUrl(draft.exerciseId)
  const catalogName = draft.originalName.trim() || draft.name
  return {
    id: draft.clientTrackedId,
    exerciseId: draft.exerciseId,
    name: catalogName,
    originalName: catalogName,
    bodyPart: draft.bodyPart,
    target: draft.target,
    equipment: draft.equipment,
    gifUrl,
    isCustom: false,
  }
}

async function hydrateOnboardingRecordCaches(): Promise<void> {
  const [home, remotePerfs] = await Promise.all([
    fetchTrackedExercisesWithPerformance(),
    fetchPerformanceEntries({ includeDeleted: true }),
  ])
  const mergedPerfs = mergePerformanceEntriesById(
    remotePerfs,
    getAllPerformanceEntries(),
  )
  setTrackedExercises(home)
  setPerformanceEntries(mergedPerfs)
  await Promise.all([
    mutate(SWR_KEYS.homeExercises, home, { revalidate: false }),
    mutate(SWR_KEYS.trackedExercises, home, { revalidate: false }),
    mutate(SWR_KEYS.performanceEntries, mergedPerfs, { revalidate: false }),
    mutate(SWR_KEYS.profile),
  ])
}

let commitInFlight: Promise<string | null> | null = null

async function commitPendingOnboardingRecordOnce(): Promise<string | null> {
  const draft = peekPendingOnboardingRecord()
  if (!draft) return null

  try {
    const tracked = await addTrackedExerciseAndWait(
      trackedExerciseFromOnboardingDraft(draft),
    )
    const trackedId = tracked.id
    await savePerformanceAndWait(trackedId, draft.weight, draft.reps, {
      id: draft.clientPerfId,
      skipRestTimer: true,
      excludeFromRestTimer: true,
    })
    clearPendingOnboardingRecord()
    try {
      await hydrateOnboardingRecordCaches()
    } catch {
      /* Les écritures locales sont déjà là ; la fiche se complétera au refetch. */
    }
    setOnboardingFirstExercisePending(true)
    setOnboardingTourComplete(true)
    setOnboardingRecordDestination(`/exercise/${trackedId}`)
    return trackedId
  } catch {
    toast.message(UI.onboardingRecordSaveError)
    return null
  }
}

export async function commitPendingOnboardingRecord(): Promise<string | null> {
  if (commitInFlight) return commitInFlight
  commitInFlight = commitPendingOnboardingRecordOnce()
  try {
    return await commitInFlight
  } finally {
    commitInFlight = null
  }
}
