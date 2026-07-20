import logoText from "@/assets/logo-text.png";
import {
  EVENT_CELEBRATION_STAGGER_MS,
  eventCardEntrance,
  eventCelebrationEntrance,
} from "@/components/event/event-motion";
import { AnimatedWords, OnboardingReveal } from "@/components/onboarding/onboarding-motion";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <div
      className={eventCelebrationEntrance(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/90",
      )}
      role="img"
      aria-label={`${UI.eventStandCongratsRecord}. ${celebration.displayName}. ${exerciseName}. ${repsLabel}`}
    >
      <Card
        className={eventCardEntrance(
          "relative mx-8 w-full max-w-4xl border-border/60 bg-card lg:mx-12 lg:max-w-5xl",
        )}
        style={{ animationDelay: `${stagger}ms` }}
      >
        <CardHeader className="flex flex-col items-center gap-6 border-b border-border/40 px-10 pb-8 pt-10 text-center lg:gap-8 lg:px-16 lg:pb-10 lg:pt-12">
          <OnboardingReveal delayMs={stagger * 2}>
            <img
              src={logoText}
              alt="One More"
              className="h-9 w-auto opacity-95 lg:h-11"
            />
          </OnboardingReveal>

          {gifUrl ? (
            <OnboardingReveal delayMs={stagger * 3}>
              <img
                src={gifUrl}
                alt=""
                className="size-24 rounded-2xl object-cover ring-1 ring-border lg:size-28"
              />
            </OnboardingReveal>
          ) : null}

          <OnboardingReveal delayMs={stagger * 4}>
            <h2 className="font-one-more text-3xl uppercase italic leading-none tracking-wide text-accent lg:text-5xl">
              <AnimatedWords
                text={UI.eventStandCongratsRecord}
                baseDelayMs={stagger * 4}
                staggerMs={70}
              />
            </h2>
          </OnboardingReveal>

          <OnboardingReveal delayMs={stagger * 5}>
            <p className="font-one-more text-base uppercase italic tracking-wide text-muted-foreground lg:text-lg">
              {exerciseName}
              <span className="mx-2 text-border" aria-hidden>
                ·
              </span>
              {genderLabel(celebration.gender)}
            </p>
          </OnboardingReveal>
        </CardHeader>

        <CardContent className="px-10 py-10 lg:px-16 lg:py-14">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-16 xl:gap-20">
            <OnboardingReveal delayMs={stagger * 6}>
              <div className="flex flex-col items-center gap-1 text-center lg:min-w-[14rem] lg:items-start lg:gap-2 lg:text-left">
                <p className="font-one-more text-2xl uppercase italic leading-tight lg:text-4xl">
                  {celebration.firstName}
                </p>
                {celebration.lastName ? (
                  <p className="font-one-more text-2xl uppercase italic leading-tight lg:text-4xl">
                    {celebration.lastName}
                  </p>
                ) : null}
              </div>
            </OnboardingReveal>

            <OnboardingReveal delayMs={stagger * 7}>
              <div className="flex flex-col items-center gap-2 border-t border-border/40 pt-10 lg:min-w-[10rem] lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0 xl:pl-20">
                <p className="font-one-more text-5xl font-bold italic tabular-nums leading-none text-accent lg:text-7xl">
                  {celebration.reps}
                </p>
                <p className="font-one-more text-sm uppercase italic tracking-[0.25em] text-muted-foreground">
                  {UI.reps}
                </p>
                {league ? (
                  <RankBadge league={league} size="md" className="mt-2" />
                ) : null}
              </div>
            </OnboardingReveal>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
