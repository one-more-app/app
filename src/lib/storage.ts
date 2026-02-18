import type { TrackedExercise, PerformanceEntry, UserProfile } from '@/types'

const TRACKED_KEY = 'one-more-tracked'
const PERFORMANCE_KEY = 'one-more-performance'
const USER_PROFILE_KEY = 'one-more-user-profile'

export function getTrackedExercises(): TrackedExercise[] {
  try {
    const raw = localStorage.getItem(TRACKED_KEY)
    const list: TrackedExercise[] = raw ? JSON.parse(raw) : []
    const needsMigration = list.some((e) => e.originalName === undefined)
    if (needsMigration) {
      const migrated = list.map((e) => ({
        ...e,
        originalName: e.originalName ?? e.name,
      }))
      setTrackedExercises(migrated)
      return migrated
    }
    return list
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

export function updateTrackedExercise(
  id: string,
  updates: Partial<Pick<TrackedExercise, 'name'>>
): void {
  const list = getTrackedExercises()
  const idx = list.findIndex((e) => e.id === id)
  if (idx === -1) return
  const { name } = updates
  list[idx] = {
    ...list[idx],
    ...(name !== undefined && { name }),
  }
  setTrackedExercises([...list])
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
    curr.weight > best.weight ||
    (curr.weight === best.weight && curr.reps > best.reps)
      ? curr
      : best
  )
}

// --- User Profile (poids, taille pour le système de ligues) ---

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  heightCm: 175,
  gender: 'male',
}

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return {
      weightKg: parsed.weightKg ?? DEFAULT_PROFILE.weightKg,
      heightCm: parsed.heightCm ?? DEFAULT_PROFILE.heightCm,
      gender: parsed.gender === 'female' ? 'female' : 'male',
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function setUserProfile(profile: Partial<UserProfile>): void {
  const current = getUserProfile()
  const updated: UserProfile = {
    weightKg: profile.weightKg ?? current.weightKg,
    heightCm: profile.heightCm ?? current.heightCm,
    gender: profile.gender ?? current.gender,
  }
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated))
}
