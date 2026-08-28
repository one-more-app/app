export type OnboardingStarterExercise = {
  exerciseId: string
  name: string
  originalName: string
  subtitle: string
  bodyPart: string
  target: string
  equipment: string
}

export const ONBOARDING_STARTER_EXERCISES: OnboardingStarterExercise[] = [
  {
    exerciseId: "EIeI8Vf",
    name: "Développé couché",
    originalName: "barbell bench press",
    subtitle: "Pectoraux",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "barbell",
  },
  {
    exerciseId: "9WTm7dq",
    name: "Dips",
    originalName: "chest dip",
    subtitle: "Pectoraux · triceps",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "body weight",
  },
  {
    exerciseId: "I4hDWkc",
    name: "Pompes",
    originalName: "push-up",
    subtitle: "Pectoraux",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "body weight",
  },
  {
    exerciseId: "lBDjFxJ",
    name: "Tractions",
    originalName: "pull-up",
    subtitle: "Dos",
    bodyPart: "back",
    target: "lats",
    equipment: "body weight",
  },
  {
    exerciseId: "25GPyDY",
    name: "Curl biceps",
    originalName: "barbell curl",
    subtitle: "Biceps",
    bodyPart: "upper arms",
    target: "biceps",
    equipment: "barbell",
  },
  {
    exerciseId: "3ZflifB",
    name: "Extension triceps",
    originalName: "cable pushdown",
    subtitle: "Triceps",
    bodyPart: "upper arms",
    target: "triceps",
    equipment: "cable",
  },
  {
    exerciseId: "10Z2DXU",
    name: "Leg press",
    originalName: "sled 45в° leg press",
    subtitle: "Jambes",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "sled machine",
  },
  {
    exerciseId: "Gnfo4FM",
    name: "Squat",
    originalName: "barbell high bar squat",
    subtitle: "Jambes",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "barbell",
  },
  {
    exerciseId: "SNFfUff",
    name: "Hip thrust",
    originalName: "barbell lying lifting (on hip)",
    subtitle: "Fessiers",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "barbell",
  },
  {
    exerciseId: "wQ2c4XD",
    name: "Romanian deadlift",
    originalName: "barbell romanian deadlift",
    subtitle: "Ischios · fessiers",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "barbell",
  },
]

export function findOnboardingStarterExercise(
  exerciseId: string,
): OnboardingStarterExercise | undefined {
  return ONBOARDING_STARTER_EXERCISES.find(
    (exercise) => exercise.exerciseId === exerciseId,
  )
}

export function onboardingTrackedId(exerciseId: string): string {
  return `api-${exerciseId}`
}

export function onboardingExerciseGifUrl(exerciseId: string): string {
  return `https://static.exercisedb.dev/media/${exerciseId}.gif`
}

export function defaultOnboardingPerf(exercise: OnboardingStarterExercise): {
  weight: number
  reps: number
} {
  if (exercise.equipment === "body weight") {
    return { weight: 0, reps: 8 }
  }
  return { weight: 60, reps: 5 }
}
