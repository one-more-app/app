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
    exerciseId: "Gnfo4FM",
    name: "Squat",
    originalName: "barbell high bar squat",
    subtitle: "Jambes",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "barbell",
  },
  {
    exerciseId: "ila4NZS",
    name: "Soulevé de terre",
    originalName: "barbell deadlift",
    subtitle: "Dos · ischios",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "barbell",
  },
  {
    exerciseId: "Kyd9Rz5",
    name: "Développé militaire",
    originalName: "barbell standing wide military press",
    subtitle: "Épaules",
    bodyPart: "shoulders",
    target: "delts",
    equipment: "barbell",
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
    exerciseId: "eZyBC3j",
    name: "Rowing barre",
    originalName: "barbell bent over row",
    subtitle: "Dos",
    bodyPart: "back",
    target: "upper back",
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
    exerciseId: "25GPyDY",
    name: "Curl biceps",
    originalName: "barbell curl",
    subtitle: "Biceps",
    bodyPart: "upper arms",
    target: "biceps",
    equipment: "barbell",
  },
  {
    exerciseId: "10Z2DXU",
    name: "Presse à cuisses",
    originalName: "sled 45° leg press",
    subtitle: "Jambes",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "sled machine",
  },
  {
    exerciseId: "t8iSghb",
    name: "Fentes",
    originalName: "barbell lunge",
    subtitle: "Jambes",
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
