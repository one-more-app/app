import { EventSpectacleOverlayShell } from "@/components/event/EventSpectacleOverlayShell";
import { EventSpectacleScoreHero } from "@/components/event/EventSpectacleScoreHero";
import { EVENT_CELEBRATION_STAGGER_MS } from "@/components/event/event-motion";
import { AnimatedWords } from "@/components/onboarding/onboarding-motion";
import type { EventActiveCelebration } from "@/lib/event-api";
import { EVENT_EXERCISE_META, type EventExerciseSlug } from "@/lib/event-constants";
import { getEventLeagueForPerf } from "@/lib/event-league";
import { UI } from "@/lib/translations";

function exerciseLabel(exercise: EventExerciseSlug): string {
  return UI[EVENT_EXERCISE_META[exercise].labelKey];
}

function genderLabel(gender: EventActiveCelebration["gender"]): string {
  return gender === "male" ? UI.eventStandMen : UI.eventStandWomen;
}

export function EventTshirtCelebrationOverlay({
  celebration,
  gifUrl,
}: {
  celebration: EventActiveCelebration;
  gifUrl?: string | null;
}) {
  const exerciseName = exerciseLabel(celebration.exercise);
  const league = getEventLeagueForPerf(
    celebration.exercise,
    celebration.gender,
    celebration.reps,
  );
  const repsLabel = UI.eventStandCongratsReps.replace(
    "{reps}",
    String(celebration.reps),
  );
  const stagger = EVENT_CELEBRATION_STAGGER_MS;

  return (
    <EventSpectacleOverlayShell
      ariaLabel={`${UI.eventStandCongratsRecord}. ${celebration.displayName}. ${exerciseName}. ${repsLabel}`}
      badgeLabel={
        <AnimatedWords
          text={UI.eventStandCongratsRecord}
          baseDelayMs={stagger * 3}
          staggerMs={70}
        />
      }
      displayName={celebration.displayName}
      exerciseName={exerciseName}
      genderLabel={genderLabel(celebration.gender)}
      gifUrl={gifUrl}
      variant="celebration"
    >
      <EventSpectacleScoreHero
        reps={celebration.reps}
        league={league}
        animationKey={celebration.entryId}
        size="tv"
        footer={
          <p className="font-one-more text-xl uppercase italic leading-snug text-accent lg:text-3xl">
            {UI.eventStandCongratsTshirt}
          </p>
        }
      />
    </EventSpectacleOverlayShell>
  );
}
