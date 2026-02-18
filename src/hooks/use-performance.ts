import { useState, useCallback, useEffect } from 'react'
import type { PerformanceEntry } from '@/types'
import {
  getEntriesByTrackedId,
  getLastPerformance,
  getPersonalBest,
  savePerformance as saveToStorage,
} from '@/lib/storage'

export function usePerformance(trackedExerciseId: string | null) {
  const [entries, setEntries] = useState<PerformanceEntry[]>([])
  const [lastPerf, setLastPerf] = useState<PerformanceEntry | undefined>()
  const [personalBest, setPersonalBest] = useState<PerformanceEntry | undefined>()

  const load = useCallback(() => {
    if (!trackedExerciseId) {
      setEntries([])
      setLastPerf(undefined)
      setPersonalBest(undefined)
      return
    }
    const e = getEntriesByTrackedId(trackedExerciseId)
    setEntries(e)
    setLastPerf(getLastPerformance(trackedExerciseId))
    setPersonalBest(getPersonalBest(trackedExerciseId))
  }, [trackedExerciseId])

  useEffect(() => {
    load()
  }, [load])

  const savePerformance = useCallback(
    (weight: number, reps: number) => {
      if (!trackedExerciseId) return
      saveToStorage(trackedExerciseId, weight, reps)
      load()
    },
    [trackedExerciseId, load]
  )

  return { entries, lastPerf, personalBest, savePerformance, refresh: load }
}
