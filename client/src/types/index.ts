// ExerciseDB v1 API response (normalized for our app)
export interface ExerciseDBExercise {
  id: string;
  name: string;
  nameFr?: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl?: string;
}

export interface TrackedExercise {
  id: string;
  exerciseId: string; // API id or 'custom-xxx'
  name: string;
  /** Nom d'origine (API) conservé pour les calculs de ligue après renommage */
  originalName?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  category?: string;
  gifUrl?: string;
  isCustom: boolean;

  /** Dernière modification (ISO). */
  updatedAt?: string;
  /** Suppression douce (ISO). */
  deletedAt?: string | null;
}

export interface PerformanceEntry {
  id: string;
  trackedExerciseId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  reps: number;
  createdAt: string; // ISO timestamp

  /** Dernière modification (ISO). */
  updatedAt?: string;
  /** Suppression douce (ISO). */
  deletedAt?: string | null;
}

export interface UserProfile {
  weightKg: number;
  heightCm: number;
  gender: "male" | "female";
  firstName?: string;
  lastName?: string;
}
