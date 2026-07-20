import { EventSpectacleOverlayShell } from "@/components/event/EventSpectacleOverlayShell";
import { EventSpectacleScoreHero } from "@/components/event/EventSpectacleScoreHero";
import type { EventAttemptResult } from "@/lib/event-api";
import { EVENT_EXERCISE_META, type EventExerciseSlug } from "@/lib/event-constants";
import { getEventLeagueForPerf } from "@/lib/event-league";
import { UI } from "@/lib/translations";

function exerciseLabel(exercise: EventExerciseSlug): string {
  return UI[EVENT_EXERCISE_META[exercise].labelKey];
}

function genderLabel(gender: EventAttemptResult["gender"]): string {
  return gender === "male" ? UI.eventStandMen : UI.eventStandWomen;
}

export function EventAttemptResultOverlay({
  result,
  gifUrl,
}: {
  result: EventAttemptResult;
  gifUrl?: string | null;
}) {
  const exerciseName = exerciseLabel(result.exercise);
  const league = getEventLeagueForPerf(
    result.exercise,
    result.gender,
    result.reps,
  );
  const rankLabel = UI.eventStandAttemptResultRank.replace(
    "{rank}",
    String(result.rank),
  );
  const isRecord = result.beatPreviousLeader;
  const resultTitle = isRecord
    ? UI.eventStandCongratsRecord
    : UI.eventStandAttemptResultTitle;

  return (
    <EventSpectacleOverlayShell
      ariaLabel={`${resultTitle}. ${result.displayName}. ${rankLabel}`}
      badgeLabel={resultTitle}
      displayName={result.displayName}
      exerciseName={exerciseName}
      genderLabel={genderLabel(result.gender)}
      gifUrl={gifUrl}
      variant={isRecord ? "celebration" : "recap"}
    >
      <EventSpectacleScoreHero
        reps={result.reps}
        league={league}
        rank={result.rank}
        animationKey={result.entryId}
        size="tv"
        footer={
          isRecord ? (
            <p className="font-one-more text-xl uppercase italic leading-snug text-accent lg:text-3xl">
              {UI.eventStandCongratsTshirt}
            </p>
          ) : undefined
        }
      />
    </EventSpectacleOverlayShell>
  );
}
