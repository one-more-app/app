import { EventLiveCounterHero } from "@/components/event/EventLiveCounterHero";
import { EventSpectacleOverlayShell } from "@/components/event/EventSpectacleOverlayShell";
import type { EventActiveAttempt } from "@/lib/event-api";
import type { EventRecordToBeat } from "@/lib/event-record";
import { EVENT_EXERCISE_META, type EventExerciseSlug } from "@/lib/event-constants";
import { getEventLeagueForPerf } from "@/lib/event-league";
import { UI } from "@/lib/translations";

function exerciseLabel(exercise: EventExerciseSlug): string {
  return UI[EVENT_EXERCISE_META[exercise].labelKey];
}

function genderLabel(gender: EventActiveAttempt["gender"]): string {
  return gender === "male" ? UI.eventStandMen : UI.eventStandWomen;
}

export function EventLiveAttemptOverlay({
  attempt,
  gifUrl,
  recordToBeat = null,
}: {
  attempt: EventActiveAttempt;
  gifUrl?: string | null;
  recordToBeat?: EventRecordToBeat | null;
}) {
  const exerciseName = exerciseLabel(attempt.exercise);
  const league =
    attempt.reps > 0
      ? getEventLeagueForPerf(attempt.exercise, attempt.gender, attempt.reps)
      : null;

  return (
    <EventSpectacleOverlayShell
      ariaLabel={`${UI.eventStandLiveAttemptLabel}. ${attempt.displayName}. ${exerciseName}. ${attempt.reps} ${UI.eventStandLiveAttemptReps}`}
      badgeLabel={UI.eventStandLiveAttemptLabel}
      displayName={attempt.displayName}
      exerciseName={exerciseName}
      genderLabel={genderLabel(attempt.gender)}
      gifUrl={gifUrl}
      variant="live"
    >
      <EventLiveCounterHero
        reps={attempt.reps}
        league={league}
        recordToBeat={recordToBeat}
        size="tv"
      />
    </EventSpectacleOverlayShell>
  );
}
