import { useState, useCallback, useEffect } from 'react'
import type { TrackedExercise, PerformanceEntry } from '@/types'
import {
  getTrackedExercises,
  removeTrackedExercise,
} from '@/lib/storage'
import {
  getLastPerformance,
  getPersonalBest,
} from '@/lib/storage'

export interface ExerciseWithPerf extends TrackedExercise {
  lastPerf: PerformanceEntry | undefined
  personalBest: PerformanceEntry | undefined
}

export function useHomeData() {
  const [exercisesWithPerf, setExercisesWithPerf] = useState<ExerciseWithPerf[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(() => {
    const tracked = getTrackedExercises()
    const withPerf: ExerciseWithPerf[] = tracked.map((ex) => ({
      ...ex,
      lastPerf: getLastPerformance(ex.id),
      personalBest: getPersonalBest(ex.id),
    }))
    setExercisesWithPerf(withPerf)
    setHasLoaded(true)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const removeExercise = useCallback((id: string) => {
    removeTrackedExercise(id)
    load()
  }, [load])

  return { exercises: exercisesWithPerf, hasLoaded, removeExercise, refresh: load }
}
