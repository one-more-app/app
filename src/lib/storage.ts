import type { TrackedExercise, PerformanceEntry } from '@/types'

const TRACKED_KEY = 'one-more-tracked'
const PERFORMANCE_KEY = 'one-more-performance'

export function getTrackedExercises(): TrackedExercise[] {
  try {
    const raw = localStorage.getItem(TRACKED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setTrackedExercises(exercises: TrackedExercise[]): void {
  localStorage.setItem(TRACKED_KEY, JSON.stringify(exercises))
}

export function addTrackedExercise(exercise: TrackedExercise): void {
  const list = getTrackedExercises()
  if (list.some((e) => e.id === exercise.id || (e.exerciseId === exercise.exerciseId && !e.isCustom))) {
    return
  }
  setTrackedExercises([...list, exercise])
}

export function removeTrackedExercise(id: string): void {
  setTrackedExercises(getTrackedExercises().filter((e) => e.id !== id))
}

export function getTrackedExerciseById(id: string): TrackedExercise | undefined {
  return getTrackedExercises().find((e) => e.id === id)
}

export function getPerformanceEntries(): PerformanceEntry[] {
  try {
    const raw = localStorage.getItem(PERFORMANCE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setPerformanceEntries(entries: PerformanceEntry[]): void {
  localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(entries))
}

export function getEntriesByTrackedId(trackedExerciseId: string): PerformanceEntry[] {
  return getPerformanceEntries()
    .filter((e) => e.trackedExerciseId === trackedExerciseId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function savePerformance(
  trackedExerciseId: string,
  weight: number,
  reps: number
): PerformanceEntry {
  const entries = getPerformanceEntries()
  const today = new Date().toISOString().slice(0, 10)

  const lastEntryForExercise = entries
    .filter((e) => e.trackedExerciseId === trackedExerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  const newEntry: PerformanceEntry = {
    id: crypto.randomUUID(),
    trackedExerciseId,
    date: today,
    weight,
    reps,
    createdAt: new Date().toISOString(),
  }

  if (lastEntryForExercise && lastEntryForExercise.date === today) {
    const updated = entries.map((e) =>
      e.id === lastEntryForExercise.id
        ? { ...e, weight, reps, createdAt: newEntry.createdAt }
        : e
    )
    setPerformanceEntries(updated)
    return { ...lastEntryForExercise, weight, reps, createdAt: newEntry.createdAt }
  }

  setPerformanceEntries([...entries, newEntry])
  return newEntry
}

export function getLastPerformance(trackedExerciseId: string): PerformanceEntry | undefined {
  const entries = getEntriesByTrackedId(trackedExerciseId)
  return entries[entries.length - 1]
}

export function getPersonalBest(trackedExerciseId: string): PerformanceEntry | undefined {
  const entries = getEntriesByTrackedId(trackedExerciseId)
  if (entries.length === 0) return undefined
  return entries.reduce((best, curr) =>
    curr.weight > best.weight ? curr : best
  )
}
