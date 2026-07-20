import logo from "@/assets/logo-white.png";
import { EventAppDownloadEncart } from "@/components/event/EventAppDownloadEncart";
import { EventExerciseColumn } from "@/components/event/EventExerciseColumn";
import {
  EventGenderBadge,
  EventGenderProgress,
} from "@/components/event/EventGenderBadge";
import { EventTshirtCelebrationOverlay } from "@/components/event/EventTshirtCelebrationOverlay";
import { EventWebOnlyGate } from "@/components/event/EventWebOnlyGate";
import { eventScreenEntrance } from "@/components/event/event-motion";
import { AnimatedWords, OnboardingReveal } from "@/components/onboarding/onboarding-motion";
import { useGenderRotation } from "@/hooks/use-gender-rotation";
import {
  buildEventDemoBoard,
  buildEventDemoExerciseMedia,
  eventLeaderboardDemoGender,
  isEventLeaderboardDemoMode,
} from "@/lib/event-demo-data";
import {
  fetchEventLeaderboard,
  type EventActiveCelebration,
  type EventExerciseMedia,
  type EventLeaderboardBoard,
} from "@/lib/event-api";
import {
  EVENT_EXERCISES,
  EVENT_GENDER_ROTATION_MS,
  EVENT_LEADERBOARD_POLL_MS,
  type EventExerciseSlug,
} from "@/lib/event-constants";
import { UI } from "@/lib/translations";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

function EventLeaderboardContent() {
  const [searchParams] = useSearchParams();
  const demoMode = isEventLeaderboardDemoMode(
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  const demoGender = eventLeaderboardDemoGender(
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  const [board, setBoard] = useState<EventLeaderboardBoard | null>(
    demoMode ? buildEventDemoBoard() : null,
  );
  const [exerciseMedia, setExerciseMedia] = useState<Record<
    EventExerciseSlug,
    EventExerciseMedia
  > | null>(demoMode ? buildEventDemoExerciseMedia() : null);
  const [activeCelebration, setActiveCelebration] =
    useState<EventActiveCelebration | null>(null);
  const { gender, progress } = useGenderRotation(EVENT_GENDER_ROTATION_MS);
  const displayGender = demoGender ?? gender;

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    if (demoMode) {
      setBoard(buildEventDemoBoard());
      setActiveCelebration(null);
      setExerciseMedia(buildEventDemoExerciseMedia());
    }
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetchEventLeaderboard();
        if (cancelled) return;
        setExerciseMedia(response.exerciseMedia);
        setBoard(response.board);
        setActiveCelebration(response.activeCelebration);
      } catch {
        /* ignore polling errors on TV */
      }
    };

    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void load();
    }, EVENT_LEADERBOARD_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [demoMode]);

  useEffect(() => {
    if (!demoMode) return undefined;

    let cancelled = false;

    const loadMedia = async () => {
      try {
        const response = await fetchEventLeaderboard();
        if (cancelled || !response.exerciseMedia) return;
        setExerciseMedia(response.exerciseMedia);
      } catch {
        /* GIF optionnel en mode démo */
      }
    };

    void loadMedia();

    return () => {
      cancelled = true;
    };
  }, [demoMode]);

  const celebrationGif = useMemo(() => {
    if (activeCelebration == null) return null;
    return exerciseMedia?.[activeCelebration.exercise]?.gifUrl ?? null;
  }, [activeCelebration, exerciseMedia]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex aspect-video w-full flex-col overflow-hidden">
        <header
          className={eventScreenEntrance(
            "flex shrink-0 items-center justify-between gap-4 border-b border-border/40 px-6 py-4 md:px-10 md:py-5",
          )}
        >
          <div className="flex items-center gap-4">
            <OnboardingReveal delayMs={0}>
              <img src={logo} alt="One More" className="h-8 w-auto md:h-10" />
            </OnboardingReveal>
            <div>
              <h1 className="font-one-more text-xl uppercase italic tracking-wide md:text-2xl">
                <AnimatedWords text={UI.eventStandTitle} baseDelayMs={80} staggerMs={100} />
              </h1>
              <p
                className={eventScreenEntrance("text-sm text-muted-foreground")}
                style={{ animationDelay: "280ms" }}
              >
                {UI.eventStandSubtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <EventGenderBadge gender={displayGender} />
            <EventGenderProgress progress={demoMode ? 0.65 : progress} />
          </div>
        </header>

        {demoMode ? (
          <p className="shrink-0 border-b border-border/40 px-6 py-2 text-center text-xs text-muted-foreground">
            {UI.eventStandDemoBanner}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 md:flex-row md:gap-4 md:p-6">
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {EVENT_EXERCISES.map((exercise, columnIndex) => (
              <EventExerciseColumn
                key={`${exercise}-${displayGender}`}
                exercise={exercise}
                rows={board?.[exercise]?.[displayGender] ?? []}
                gender={displayGender}
                genderKey={`${exercise}-${displayGender}`}
                gifUrl={exerciseMedia?.[exercise]?.gifUrl}
                columnIndex={columnIndex}
              />
            ))}
          </div>
          <EventAppDownloadEncart />
        </div>
      </div>

      {!demoMode && activeCelebration ? (
        <EventTshirtCelebrationOverlay
          celebration={activeCelebration}
          gifUrl={celebrationGif}
        />
      ) : null}
    </div>
  );
}

export function EventLeaderboardPage() {
  return (
    <EventWebOnlyGate>
      <EventLeaderboardContent />
    </EventWebOnlyGate>
  );
}
