// ExerciseDB v1 API response (normalized for our app)
export interface ExerciseDBExercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  secondaryMuscles: string[]
  instructions: string[]
  gifUrl?: string
}

export interface TrackedExercise {
  id: string
  exerciseId: string // API id or 'custom-xxx'
  name: string
  bodyPart?: string
  target?: string
  equipment?: string
  category?: string
  gifUrl?: string
  isCustom: boolean
}

export interface PerformanceEntry {
  id: string
  trackedExerciseId: string
  date: string // YYYY-MM-DD
  weight: number
  reps: number
  createdAt: string // ISO timestamp
}

export interface UserProfile {
  weightKg: number
  heightCm: number
  gender: 'male' | 'female'
}
