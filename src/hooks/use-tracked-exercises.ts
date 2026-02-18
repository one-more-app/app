import { useState, useCallback, useEffect } from 'react'
import type { TrackedExercise } from '@/types'
import {
  getTrackedExercises,
  setTrackedExercises,
  addTrackedExercise as addStorage,
  removeTrackedExercise as removeStorage,
} from '@/lib/storage'

export function useTrackedExercises() {
  const [exercises, setExercises] = useState<TrackedExercise[]>([])

  const load = useCallback(() => {
    setExercises(getTrackedExercises())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addExercise = useCallback(
    (exercise: Omit<TrackedExercise, 'id'>) => {
      const withId: TrackedExercise = {
        ...exercise,
        id: exercise.isCustom ? exercise.exerciseId : `api-${exercise.exerciseId}`,
      }
      addStorage(withId)
      load()
    },
    [load]
  )

  const removeExercise = useCallback(
    (id: string) => {
      removeStorage(id)
      load()
    },
    [load]
  )

  return { exercises, addExercise, removeExercise, refresh: load }
}
