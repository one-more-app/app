import { EventSpectacleOverlayShell } from "@/components/event/EventSpectacleOverlayShell";
import { EventSpectacleScoreHero } from "@/components/event/EventSpectacleScoreHero";
import type { EventAttemptResult } from "@/lib/event-api";
import { EVENT_EXERCISE_META, type EventExerciseSlug } from "@/lib/event-constants";
import { getEventLeagueForPerf } from "@/lib/event-league";
import { UI } from "@/lib/translations";
import { Instagram } from "lucide-react";

const EVENT_INSTAGRAM_QR_SRC = "/images/event/instagram-qr.svg";

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
    const instagramLead = isRecord
        ? UI.eventStandInstagramLeadWon
        : UI.eventStandInstagramLeadRetry;

    return (
        <EventSpectacleOverlayShell
            ariaLabel={`${resultTitle}${isRecord ? `. ${UI.eventStandWonBadge}` : ""}. ${result.displayName}. ${rankLabel}. ${instagramLead} ${UI.eventStandInstagramHandle}. ${UI.eventStandInstagramGiveawayCta}`}
            badgeLabel={
                isRecord ? (
                    <div className="flex flex-col items-center gap-4 lg:gap-6">
                        <span>{UI.eventStandCongratsRecord}</span>
                        <span className="text-4xl text-accent lg:text-6xl">
                            {UI.eventStandWonBadge}
                        </span>
                    </div>
                ) : (
                    resultTitle
                )
            }
            displayName={result.displayName}
            exerciseName={exerciseName}
            genderLabel={genderLabel(result.gender)}
            gifUrl={gifUrl}
            variant={isRecord ? "celebration" : "recap"}
        >
            <div className="flex w-full flex-col items-center gap-8 lg:gap-12">
                <EventSpectacleScoreHero
                    reps={result.reps}
                    league={league}
                    rank={result.rank}
                    animationKey={result.entryId}
                    size="tv"
                />

                <div className="flex items-center gap-5 lg:gap-7">
                    <img
                        src={EVENT_INSTAGRAM_QR_SRC}
                        alt={UI.eventStandInstagramQrAlt}
                        className="size-44 shrink-0 rounded-xl bg-white p-2"
                        draggable={false}
                    />

                    <div className="flex min-w-0 flex-col gap-3 border-l border-border/50 pl-5 text-left lg:gap-4 lg:pl-7">
                        <p className="font-one-more text-4xl uppercase italic leading-none text-accent">
                            {instagramLead}
                        </p>
                        <div className="flex items-center gap-2.5">
                            <Instagram
                                aria-hidden
                                className="size-6 shrink-0 text-foreground lg:size-8"
                                strokeWidth={1.75}
                            />
                            <p className="font-one-more text-3xl italic leading-none tracking-wide text-foreground">
                                {UI.eventStandInstagramHandle}
                            </p>
                        </div>
                        <p className="max-w-xs text-xl  leading-snug text-muted-foreground lg:max-w-sm">
                            {UI.eventStandInstagramGiveawayCta}
                        </p>
                    </div>
                </div>
            </div>
        </EventSpectacleOverlayShell>
    );
}
