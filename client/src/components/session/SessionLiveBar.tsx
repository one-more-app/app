import { AddPerfDrawer } from "@/components/AddPerfDrawer";
import { ExerciseImage } from "@/components/ExerciseImage";
import { RestCounterTour } from "@/components/RestCounterTour";
import { RestTargetQuickEdit } from "@/components/RestTargetQuickEdit";
import {
    EndSessionDrawer,
    type EndSessionStats,
} from "@/components/session/EndSessionDrawer";
import { Button } from "@/components/ui/button";
import {
    useHomeExercisesData,
    usePerformanceDataRefresh,
} from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useLiveSession, type LiveSession } from "@/hooks/use-live-session";
import { useRestSinceLastSet } from "@/hooks/use-rest-since-last-set";
import { useRestTimerEnabled } from "@/hooks/use-rest-timer-enabled";
import { trackRestTimerDismissed } from "@/lib/analytics";
import { readStoredSession } from "@/lib/auth";
import { getExerciseImageUrl } from "@/lib/exercisedb";
import {
    formatRestElapsed,
    formatRestElapsedA11y,
} from "@/lib/format-rest-elapsed";
import { formatSessionChrono } from "@/lib/format-session-chrono";
import { hapticImpact } from "@/lib/haptics";
import { resolveTrackedExercise } from "@/lib/history-entries";
import { notifyPerfMilestones } from "@/lib/perf-notifications";
import { dismissCurrentRestPeriod } from "@/lib/rest-timer-local-notifications";
import {
    daySessionsSwrKey,
    endSession,
    endSessionById,
    sessionPath,
    sessionSwrKey,
    sessionSwrKeyById,
    type WorkoutSession,
} from "@/lib/session-api";
import { getPersonalBest, savePerformanceAndWait } from "@/lib/storage";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { notifyXpGrants } from "@/lib/xp-notifications";
import type { TrackedExercise } from "@/types";
import { ChevronRight, Clock, Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

/** Variable CSS (sur `html`) : hauteur occupée par la barre, pour le padding bas des pages. */
export const SESSION_BAR_HEIGHT_VAR = "--session-bar-height";

function seriesLabel(count: number): string {
    return count === 1
        ? UI.homeLiveSeriesOne
        : UI.historySeriesCount.replace("{count}", String(count));
}

function exercisesLabel(count: number): string {
    return count === 1
        ? UI.homeRecapExercisesOne
        : UI.homeRecapExercises.replace("{count}", String(count));
}

function SessionChrono({ startedAtMs }: { startedAtMs: number }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <span className="font-one-more text-xl font-bold italic leading-none tabular-nums text-white">
            {formatSessionChrono(now - startedAtMs)}
        </span>
    );
}

type SessionRowProps = {
    live: LiveSession;
    onFinish: () => void;
    onOpenHome?: () => void;
    withTopBorder?: boolean;
};

function SessionRow({
    live,
    onFinish,
    onOpenHome,
    withTopBorder = false,
}: SessionRowProps) {
    const sessionSummary = (
        <>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[0.6875rem] font-medium uppercase leading-none tracking-wide text-white/60">
                    {UI.sessionBarSession.replace(
                        "{exercises}",
                        exercisesLabel(live.exerciseCount),
                    )}
                </span>
                <SessionChrono startedAtMs={live.startedAtMs} />
            </span>
            {onOpenHome ? (
                <ChevronRight className="size-5 shrink-0 text-white/50" aria-hidden />
            ) : null}
        </>
    );

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2.5",
                withTopBorder && "border-t border-white/10",
            )}
        >
            {onOpenHome ? (
                <button
                    type="button"
                    onClick={onOpenHome}
                    aria-label={UI.sessionBarOpenHomeAria}
                    data-analytics-label="session_bar_open_home"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none transition-opacity active:opacity-80 focus-visible:ring-2 focus-visible:ring-accent"
                >
                    {sessionSummary}
                </button>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {sessionSummary}
                </div>
            )}
            <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-white/30 bg-transparent px-4 text-sm font-semibold text-white hover:bg-white/10 hover:text-white dark:border-white/30 dark:bg-transparent dark:hover:bg-white/10"
                onClick={onFinish}
                aria-label={UI.sessionBarFinishAria}
                data-analytics-label="session_bar_finish"
            >
                {UI.sessionBarFinish}
            </Button>
        </div>
    );
}

type BottomRowProps = {
    live: LiveSession;
    /** `createdAt` de la dernière perf globale (source du repos). */
    restCreatedAt: string | null;
    restSourceExerciseId?: string;
    onFinish: () => void;
    /** Ouvre l'accueil (séance live). Absent / no-op si déjà sur l'accueil. */
    onOpenHome?: () => void;
    /** Filet haut : uniquement si la rangée exercice est affichée au-dessus. */
    withTopBorder?: boolean;
    /**
     * Sur la fiche de l'exo en cours : garder le bloc séance au-dessus du chrono repos.
     * Sur l'accueil, le repos remplace la rangée séance.
     */
    keepSessionAboveRest?: boolean;
};

/**
 * Rangée du bas : repos (lime) tant qu'un repos est en cours, sinon séance + Terminer.
 * Montée avec `key={restCreatedAt}` : le compteur et le dismiss repartent à chaque nouvelle série.
 */
function BottomRow({
    live,
    restCreatedAt,
    restSourceExerciseId,
    onFinish,
    onOpenHome,
    withTopBorder = true,
    keepSessionAboveRest = false,
}: BottomRowProps) {
    const [dismissed, setDismissed] = useState(false);
    const { enabled } = useRestTimerEnabled();
    const { visible, elapsedMs, targetMs, targetComplete, progress01 } =
        useRestSinceLastSet(restCreatedAt);

    useEffect(() => {
        if (enabled) setDismissed(false);
    }, [enabled]);

    // Une fois la cible atteinte : plus de rangée repos (comme le prototype),
    // on revient à séance + Terminer. Le toast fin de repos reste géré à part.
    const resting = visible && enabled && !dismissed && !targetComplete;

    if (!resting) {
        return (
            <SessionRow
                live={live}
                onFinish={onFinish}
                onOpenHome={onOpenHome}
                withTopBorder={withTopBorder}
            />
        );
    }

    const remainingMs = Math.max(0, targetMs - elapsedMs);
    const countdown = formatRestElapsed(Math.ceil(remainingMs / 1000) * 1000);
    const a11yLabel = UI.sessionBarRestRemainingA11y.replace(
        "{time}",
        formatRestElapsedA11y(remainingMs),
    );
    const minuteBucket =
        elapsedMs >= 60_000 ? Math.floor(elapsedMs / 60_000) : null;
    const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return (
        <>
            {keepSessionAboveRest ? (
                <SessionRow
                    live={live}
                    onFinish={onFinish}
                    onOpenHome={onOpenHome}
                    withTopBorder={withTopBorder}
                />
            ) : null}
            <div
                data-tour="rest-counter"
                role="status"
                aria-label={a11yLabel}
                className="session-rest-pop-anim relative flex items-center gap-3 overflow-hidden bg-accent px-3 py-2.5 text-accent-foreground"
            >
                {/* Remplissage gauche → droite comme sur la maquette (overlay sombre sur lime). */}
                <span
                    aria-hidden
                    className={cn(
                        "absolute inset-y-0 left-0 bg-black/10",
                        !reducedMotion && "transition-[width] duration-1000 ease-linear",
                    )}
                    style={{ width: `${progress01 * 100}%` }}
                />
                <span
                    aria-hidden
                    className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-black/10"
                >
                    <Clock className="size-5" />
                </span>
                <div className="relative flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[0.6875rem] font-medium uppercase leading-none tracking-wide opacity-70">
                        {UI.restSinceLastSet}
                    </span>
                    <span
                        className="font-one-more text-xl font-bold italic leading-none tabular-nums"
                        aria-hidden
                    >
                        {countdown}
                    </span>
                </div>
                <RestTargetQuickEdit
                    side="top"
                    align="end"
                    className="relative h-8 gap-1.5 border-transparent bg-white/70 px-3 text-sm font-semibold text-black hover:bg-white/90"
                />
                <Button
                    type="button"
                    variant="secondary"
                    className="bg-primary/10"
                    onClick={(event) => {
                        event.stopPropagation();
                        trackRestTimerDismissed({
                            elapsedMs,
                            trackedExerciseId: restSourceExerciseId,
                        });
                        if (restCreatedAt) dismissCurrentRestPeriod(restCreatedAt);
                        setDismissed(true);
                    }}
                    aria-label={UI.sessionBarRestPassAria}
                >
                    {UI.sessionBarRestPass}
                </Button>
                {minuteBucket != null ? (
                    <span key={minuteBucket} className="sr-only" aria-live="polite">
                        {a11yLabel}
                    </span>
                ) : null}
            </div>
            <RestCounterTour barVisible />
        </>
    );
}

type SessionLiveBarProps = {
    /** La `BottomNav` est affichée : la barre se pose au dessus. */
    navVisible: boolean;
};

/**
 * Barre primary "séance en cours" au dessus de la BottomNav (accueil, fiche exercice).
 * Inclut la rangée repos (lime) pendant une séance live.
 */
export function SessionLiveBar({ navVisible }: SessionLiveBarProps) {
    const live = useLiveSession();
    const latestGlobalPerf = useLatestGlobalPerf();
    const { data: homeExercises = [] } = useHomeExercisesData();
    const auth = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { mutate } = useSWRConfig();
    const refreshAfterPerfChange = usePerformanceDataRefresh();

    const ownerUserId =
        (auth.status === "authenticated" ? auth.user?.id : undefined) ??
        readStoredSession()?.user.id;

    const [addOpen, setAddOpen] = useState(false);
    const [endStats, setEndStats] = useState<EndSessionStats | null>(null);
    const [ending, setEnding] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const visible = live != null;

    useLayoutEffect(() => {
        const el = wrapperRef.current;
        if (!visible || !el) return;
        const root = document.documentElement;
        const sync = () =>
            root.style.setProperty(
                SESSION_BAR_HEIGHT_VAR,
                `${el.getBoundingClientRect().height}px`,
            );
        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(el);
        return () => {
            observer.disconnect();
            root.style.removeProperty(SESSION_BAR_HEIGHT_VAR);
        };
    }, [visible]);

    const currentExerciseId = live?.lastEntry.trackedExerciseId ?? null;
    const exercise = useMemo<TrackedExercise | undefined>(() => {
        if (!currentExerciseId) return undefined;
        return (
            homeExercises.find((ex) => ex.id === currentExerciseId && !ex.deletedAt) ??
            resolveTrackedExercise(currentExerciseId)
        );
    }, [homeExercises, currentExerciseId]);

    if (!live || !currentExerciseId) return null;

    const name = exercise?.name ?? UI.exerciseNotFound;
    const onHome = pathname === "/home";
    const onCurrentExercisePage = pathname === `/exercise/${currentExerciseId}`;
    const onOtherExercisePage =
        pathname.startsWith("/exercise/") && !onCurrentExercisePage;
  /** Rangée exo : uniquement sur une autre fiche (retour vers l'exo en cours). */
  const showExerciseRow = onOtherExercisePage;

    const openExercise = () => {
        if (onCurrentExercisePage) return;
        void hapticImpact();
        navigate(`/exercise/${currentExerciseId}`);
    };

    const openHome = () => {
        if (onHome) return;
        void hapticImpact();
        navigate("/home");
    };

    const openEndDrawer = () => {
        void hapticImpact();
        setEndStats({
            exerciseCount: live.exerciseCount,
            setCount: live.setCount,
            durationMs: Date.now() - live.startedAtMs,
        });
    };

    const handleConfirmEnd = async () => {
        if (!ownerUserId || ending) return;
        setEnding(true);
        try {
            const result = live.sessionId
                ? await endSessionById(live.sessionId)
                : await endSession(ownerUserId, live.dayKey);
            const endedAt = result.endedAt;
            const nextSessionId = result.id ?? live.sessionId;
            if (nextSessionId) {
                await mutate(
                    sessionSwrKeyById(nextSessionId),
                    (current: WorkoutSession | undefined) =>
                        current ? { ...current, endedAt, isLive: false } : current,
                    { revalidate: true },
                );
            }
            await mutate(
                sessionSwrKey(ownerUserId, live.dayKey),
                (current: WorkoutSession | undefined) =>
                    current ? { ...current, endedAt, isLive: false } : current,
                { revalidate: true },
            );
            await mutate(daySessionsSwrKey(ownerUserId, live.dayKey));
            setEndStats(null);
            if (nextSessionId) {
                navigate(sessionPath(nextSessionId));
            }
        } catch {
            toast.error(UI.endSessionError);
        } finally {
            setEnding(false);
        }
    };

    const handleSaveSet = (weight: number, reps: number) => {
        if (!exercise) return;
        const prevPB = getPersonalBest(exercise.id) ?? null;
        void (async () => {
            try {
                const { xp } = await savePerformanceAndWait(exercise.id, weight, reps, {
                    date: live.dayKey,
                });
                notifyXpGrants(xp);
                const nextPB = getPersonalBest(exercise.id) ?? null;
                notifyPerfMilestones({
                    exerciseName: exercise.name,
                    prevPB,
                    nextPB,
                    savedWeight: weight,
                    savedReps: reps,
                    league: xp?.league,
                    exerciseImageUrl: getExerciseImageUrl(exercise.gifUrl) || undefined,
                    bodyPart: exercise.bodyPart,
                    target: exercise.target,
                });
            } finally {
                await Promise.all([
                    ownerUserId
                        ? mutate(sessionSwrKey(ownerUserId, live.dayKey))
                        : Promise.resolve(),
                    refreshAfterPerfChange(),
                ]);
                setAddOpen(false);
            }
        })();
    };

    const restCreatedAt = latestGlobalPerf?.entry.createdAt ?? null;

    return (
        <>
            <div
                ref={wrapperRef}
                data-session-live-bar
                className="pointer-events-none fixed inset-x-0 z-[25] px-3 pt-2"
                style={{
                    bottom: navVisible
                        ? "calc(var(--bottom-nav-height) + var(--safe-bottom))"
                        : 0,
                    paddingBottom: navVisible
                        ? "0.5rem"
                        : "calc(var(--safe-bottom) + 0.5rem)",
                    paddingLeft: "max(0.75rem, var(--safe-left))",
                    paddingRight: "max(0.75rem, var(--safe-right))",
                }}
            >
                <div
                    role="region"
                    aria-label={UI.sessionBarA11y}
                    className="session-bar-rise-anim pointer-events-auto mx-auto max-w-2xl overflow-hidden rounded-2xl bg-primary text-primary-foreground ring-1 ring-primary-foreground/10"
                >
                    {showExerciseRow ? (
                        <div className="flex items-center gap-3 px-3 py-2.5">
                            <button
                                type="button"
                                onClick={openExercise}
                                aria-label={UI.homeLiveOpenExerciseAria.replace("{name}", name)}
                                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white">
                                    <ExerciseImage
                                        gifUrl={exercise?.gifUrl}
                                        isCustom={exercise?.isCustom}
                                        bodyPart={exercise?.bodyPart}
                                        target={exercise?.target}
                                        className="size-full"
                                        imgClassName="size-full object-cover"
                                        fallbackIconClassName="size-5 text-neutral-400"
                                    />
                                </span>
                                <span className="flex min-w-0 flex-col gap-1">
                                    <span className="text-[0.6875rem] font-medium uppercase leading-none tracking-wide text-white/60">
                                        {UI.sessionBarExercise.replace(
                                            "{series}",
                                            seriesLabel(live.currentExerciseSetCount),
                                        )}
                                    </span>
                                    <span className="truncate font-one-more text-sm font-bold uppercase italic leading-tight">
                                        {name}
                                    </span>
                                </span>
                            </button>
                            <Button
                                type="button"
                                size="icon"
                                disabled={!exercise}
                                onClick={() => {
                                    void hapticImpact();
                                    setAddOpen(true);
                                }}
                                aria-label={UI.homeLiveAddSetAria.replace("{name}", name)}
                                data-analytics-label="session_bar_add_set"
                                className="size-10 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                <Plus className="size-5" aria-hidden />
                            </Button>
                        </div>
                    ) : null}

          <BottomRow
            key={restCreatedAt ?? "none"}
            live={live}
            restCreatedAt={restCreatedAt}
            restSourceExerciseId={latestGlobalPerf?.exercise?.id}
            onFinish={openEndDrawer}
            onOpenHome={onHome ? undefined : openHome}
            withTopBorder={showExerciseRow}
            keepSessionAboveRest={onCurrentExercisePage}
          />
                </div>
            </div>

            {addOpen && exercise ? (
                <AddPerfDrawer
                    open
                    onOpenChange={(open) => !open && setAddOpen(false)}
                    exercise={{
                        id: exercise.id,
                        name: exercise.name,
                        originalName: exercise.originalName,
                        equipment: exercise.equipment,
                        target: exercise.target,
                    }}
                    initialWeight={live.lastEntry.weight}
                    initialReps={live.lastEntry.reps}
                    onSave={handleSaveSet}
                />
            ) : null}

            <EndSessionDrawer
                open={endStats != null}
                onOpenChange={(open) => !open && setEndStats(null)}
                stats={
                    endStats ?? { exerciseCount: 0, setCount: 0, durationMs: 0 }
                }
                onConfirm={handleConfirmEnd}
                confirmLoading={ending}
            />
        </>
    );
}
