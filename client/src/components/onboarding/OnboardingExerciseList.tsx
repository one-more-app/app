import { ExerciseImage } from "@/components/ExerciseImage"
import { ExerciseTitle } from "@/components/ExerciseTitle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { hapticImpact, hapticImpactMedium } from "@/lib/haptics"
import {
  ONBOARDING_STARTER_EXERCISES,
  onboardingExerciseGifUrl,
  type OnboardingStarterExercise,
} from "@/lib/onboarding-starter-exercises"
import { UI } from "@/lib/translations"
import { Plus } from "lucide-react"

type OnboardingExerciseListProps = {
  onSelect: (exercise: OnboardingStarterExercise) => void
}

export function OnboardingExerciseList({
  onSelect,
}: OnboardingExerciseListProps) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
      {ONBOARDING_STARTER_EXERCISES.map((exercise) => (
        <li key={exercise.exerciseId}>
          <Card
            className="relative cursor-pointer px-3 py-3"
            onClick={() => {
              void hapticImpact()
              onSelect(exercise)
            }}
          >
            <CardHeader className="flex min-w-0 flex-row items-stretch gap-4 p-0">
              <div className="size-14 shrink-0 self-center overflow-hidden rounded-lg bg-muted">
                <ExerciseImage
                  gifUrl={onboardingExerciseGifUrl(exercise.exerciseId)}
                  bodyPart={exercise.bodyPart}
                  target={exercise.target}
                  className="size-full"
                  imgClassName="size-full object-cover"
                  fallbackIconClassName="size-7 text-muted-foreground"
                />
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-2 self-stretch">
                <ExerciseTitle
                  as="h3"
                  className="font-one-more text-xs uppercase italic"
                >
                  {exercise.name}
                </ExerciseTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{exercise.subtitle}</Badge>
                </div>
              </div>
              <Button
                size="icon"
                variant="default"
                className="size-11 shrink-0 self-center rounded-full"
                data-analytics-label={`onboarding_record_${exercise.exerciseId}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void hapticImpactMedium()
                  onSelect(exercise)
                }}
                haptic={false}
                aria-label={`${exercise.name}. ${UI.onboardingPerfTitle}`}
              >
                <Plus className="size-5" />
              </Button>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  )
}
