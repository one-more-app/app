import { ExerciseImage } from "@/components/ExerciseImage"
import { ExerciseTitle } from "@/components/ExerciseTitle"
import {
  ONBOARDING_STARTER_EXERCISES,
  onboardingExerciseGifUrl,
  type OnboardingStarterExercise,
} from "@/lib/onboarding-starter-exercises"
import { hapticImpact } from "@/lib/haptics"
import { UI } from "@/lib/translations"

type OnboardingExerciseListProps = {
  onSelect: (exercise: OnboardingStarterExercise) => void
}

export function OnboardingExerciseList({
  onSelect,
}: OnboardingExerciseListProps) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
      {ONBOARDING_STARTER_EXERCISES.map((exercise) => (
        <li key={exercise.exerciseId}>
          <button
            type="button"
            data-analytics-label={`onboarding_record_${exercise.exerciseId}`}
            onClick={() => {
              void hapticImpact()
              onSelect(exercise)
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <ExerciseImage
                gifUrl={onboardingExerciseGifUrl(exercise.exerciseId)}
                bodyPart={exercise.bodyPart}
                target={exercise.target}
                className="size-full"
                imgClassName="size-full object-cover"
                fallbackIconClassName="size-7 text-muted-foreground"
              />
            </div>
            <span className="min-w-0 flex-1">
              <ExerciseTitle
                as="span"
                className="font-one-more text-xs uppercase italic text-foreground"
              >
                {exercise.name}
              </ExerciseTitle>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {exercise.subtitle}
              </span>
            </span>
            <span className="sr-only">{UI.newPerf}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
