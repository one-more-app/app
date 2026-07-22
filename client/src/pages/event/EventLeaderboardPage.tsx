import { OneMoreLogoMark } from "@/components/OneMoreLogoMark";
import { EventAppDownloadEncart } from "@/components/event/EventAppDownloadEncart";
import { EventAttemptResultOverlay } from "@/components/event/EventAttemptResultOverlay";
import { EventExerciseColumn } from "@/components/event/EventExerciseColumn";
import {
    EventGenderBadge,
    EventGenderProgress,
} from "@/components/event/EventGenderBadge";
import { EventLiveAttemptOverlay } from "@/components/event/EventLiveAttemptOverlay";
import { EventTshirtCelebrationOverlay } from "@/components/event/EventTshirtCelebrationOverlay";
import { EventWebOnlyGate } from "@/components/event/EventWebOnlyGate";
import { eventScreenEntrance } from "@/components/event/event-motion";
import { AnimatedWords, OnboardingReveal } from "@/components/onboarding/onboarding-motion";
import { useGenderRotation } from "@/hooks/use-gender-rotation";
import {
    fetchEventLeaderboard,
    type EventActiveAttempt,
    type EventActiveCelebration,
    type EventAttemptResult,
    type EventLeaderboardBoard,
} from "@/lib/event-api";
import {
    EVENT_EXERCISE_ICONS,
    EVENT_EXERCISES,
    EVENT_GENDER_ROTATION_MS,
    EVENT_LEADERBOARD_POLL_MS,
    EVENT_LIVE_ATTEMPT_POLL_MS,
    EVENT_TITLE_REPLAY_MS,
    type EventGenderSlug,
} from "@/lib/event-constants";
import {
    buildEventDemoBoard,
    eventLeaderboardDemoGender,
    isEventLeaderboardDemoMode,
} from "@/lib/event-demo-data";
import { getEventRecordToBeat } from "@/lib/event-record";
import { UI } from "@/lib/translations";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const TITLE_BASE_DELAY_MS = 80;
const TITLE_STAGGER_MS = 100;

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
    const [activeCelebration, setActiveCelebration] =
        useState<EventActiveCelebration | null>(null);
    const [activeAttempt, setActiveAttempt] = useState<EventActiveAttempt | null>(null);
    const [recentResult, setRecentResult] = useState<EventAttemptResult | null>(null);
    const [titleAnimKey, setTitleAnimKey] = useState(0);
    const { gender, progress } = useGenderRotation(EVENT_GENDER_ROTATION_MS);

    const displayGender: EventGenderSlug =
        activeAttempt?.gender ?? demoGender ?? gender;

    const showResultOverlay = !activeAttempt && recentResult != null;

    const showCelebrationOverlay =
        !activeAttempt && !showResultOverlay && activeCelebration != null;

    const titleAccentDelayMs = useMemo(() => {
        const leadWords = UI.eventStandTitle.split(/\s+/).filter(Boolean).length;
        return TITLE_BASE_DELAY_MS + leadWords * TITLE_STAGGER_MS;
    }, []);

    useEffect(() => {
        document.documentElement.classList.add("dark");
        return () => {
            document.documentElement.classList.remove("dark");
        };
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (document.visibilityState === "hidden") return;
            setTitleAnimKey((key) => key + 1);
        }, EVENT_TITLE_REPLAY_MS);
        return () => window.clearInterval(interval);
    }, []);
    useEffect(() => {
        if (demoMode) {
            setBoard(buildEventDemoBoard());
            setActiveCelebration(null);
            setActiveAttempt(null);
            setRecentResult(null);
        }
    }, [demoMode]);

    const hasActiveAttempt = activeAttempt != null;

    useEffect(() => {
        if (demoMode) return undefined;

        let cancelled = false;
        const pollMs = hasActiveAttempt
            ? EVENT_LIVE_ATTEMPT_POLL_MS
            : EVENT_LEADERBOARD_POLL_MS;

        const load = async () => {
            try {
                const response = await fetchEventLeaderboard();
                if (cancelled) return;
                setBoard(response.board);
                setActiveCelebration(response.activeCelebration);
                setActiveAttempt(response.activeAttempt);
                setRecentResult(response.recentResult);
            } catch {
                /* ignore polling errors on TV */
            }
        };

        void load();
        const interval = window.setInterval(() => {
            if (document.visibilityState === "hidden") return;
            void load();
        }, pollMs);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [demoMode, hasActiveAttempt]);

    const liveRecordToBeat = useMemo(() => {
        if (!activeAttempt) return null;
        return getEventRecordToBeat(board, activeAttempt.exercise, activeAttempt.gender);
    }, [activeAttempt, board]);

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="flex aspect-video w-full flex-col overflow-hidden">
                <header
                    className={eventScreenEntrance(
                        "flex shrink-0 items-center justify-center gap-4 border-b border-border/40 px-6 py-4 md:px-10 md:py-5",
                    )}
                >
                    <OnboardingReveal delayMs={0}>
                        <OneMoreLogoMark
                            key={titleAnimKey}
                            variant="light"
                            className="h-8 w-auto md:h-10"
                        />
                    </OnboardingReveal>
                    <div className="ml-auto flex items-center gap-4">
                        <div>
                            <h1
                                key={titleAnimKey}
                                className="font-one-more text-4xl uppercase italic tracking-wide"
                            >
                                <AnimatedWords
                                    text={UI.eventStandTitle}
                                    baseDelayMs={TITLE_BASE_DELAY_MS}
                                    staggerMs={TITLE_STAGGER_MS}
                                />
                                {"\u00A0"}
                                <span className="text-accent">
                                    <AnimatedWords
                                        text={UI.eventStandTitleAccent}
                                        baseDelayMs={titleAccentDelayMs}
                                        staggerMs={TITLE_STAGGER_MS}
                                    />
                                </span>
                            </h1>
                        </div>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-2">
                        <EventGenderBadge gender={displayGender} />
                        <EventGenderProgress
                            progress={activeAttempt || demoMode ? 0.65 : progress}
                        />
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
                                gifUrl={EVENT_EXERCISE_ICONS[exercise]}
                                columnIndex={columnIndex}
                            />
                        ))}
                    </div>
                    <EventAppDownloadEncart />
                </div>
            </div>

            {!demoMode && activeAttempt ? (
                <EventLiveAttemptOverlay
                    attempt={activeAttempt}
                    gifUrl={EVENT_EXERCISE_ICONS[activeAttempt.exercise]}
                    recordToBeat={liveRecordToBeat}
                />
            ) : null}

            {!demoMode && showResultOverlay && recentResult ? (
                <EventAttemptResultOverlay
                    result={recentResult}
                    gifUrl={EVENT_EXERCISE_ICONS[recentResult.exercise]}
                />
            ) : null}

            {!demoMode && showCelebrationOverlay && activeCelebration ? (
                <EventTshirtCelebrationOverlay
                    celebration={activeCelebration}
                    gifUrl={EVENT_EXERCISE_ICONS[activeCelebration.exercise]}
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
