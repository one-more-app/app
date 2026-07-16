import { AddPerfDrawer } from "@/components/AddPerfDrawer";
import { BackHeader } from "@/components/BackHeader";
import { HistoryDaySection } from "@/components/history/HistoryDaySection";
import { SessionCommentsThread } from "@/components/session/SessionCommentsThread";
import { HistoryPageSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useSessionLive } from "@/hooks/use-session-live";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { getExerciseImageUrl } from "@/lib/exercisedb";
import {
    entryInsightsFromPerformances,
    formatDayHeading,
    groupByDayThenExercise,
    resolveTrackedExercise,
} from "@/lib/history-entries";
import { notifyPerfMilestones } from "@/lib/perf-notifications";
import { getProfileDisplayName } from "@/lib/profile-display";
import {
    fetchSession,
    sessionSwrKey,
} from "@/lib/session-api";
import {
    deletePerformanceAndWait,
    getPersonalBest,
    savePerformanceAndWait,
    updatePerformanceAndWait,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { notifyXpGrants } from "@/lib/xp-notifications";
import type { PerformanceEntry } from "@/types";
import { Radio } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR, { useSWRConfig } from "swr";

export default function SessionPage() {
    const { ownerUserId, date } = useParams<{
        ownerUserId: string;
        date: string;
    }>();
    const auth = useAuth();
    const { mutate } = useSWRConfig();
    const currentUserId = auth.status === "authenticated" ? auth.user?.id ?? null : null;
    const isOwner = Boolean(currentUserId && ownerUserId === currentUserId);

    const { data: session, isLoading, error } = useSWR(
        ownerUserId && date ? sessionSwrKey(ownerUserId, date) : null,
        () => fetchSession(ownerUserId!, date!),
    );

    useSessionLive(ownerUserId, date);

    const [editEntry, setEditEntry] = useState<PerformanceEntry | null>(null);
    const [addPerf, setAddPerf] = useState<{
        date: string;
        trackedExerciseId: string;
    } | null>(null);

    const entries = session?.entries ?? [];
    const exercises = session?.exercises ?? [];

    const { label: sessionTimingLabel } = useSessionTiming(entries, {
        dayKey: date ?? "",
        isPresenceTraining: session?.isLive,
    });

    const sessionSummaryLine = useMemo(() => {
        if (!session) return "";
        const base = UI.sessionSummary
            .replace("{exercises}", String(session.exerciseCount))
            .replace("{records}", String(session.highlights.length));
        if (!sessionTimingLabel) return base;
        return `${base} · ${sessionTimingLabel}`;
    }, [session, sessionTimingLabel]);

    const dayGroups = useMemo(
        () => groupByDayThenExercise(entries),
        [entries],
    );

    const entryInsights = useMemo(
        () => entryInsightsFromPerformances(entries),
        [entries],
    );

    const resolveExercise = useCallback(
        (trackedId: string) => {
            const fromSession = exercises.find((exercise) => exercise.id === trackedId);
            if (fromSession) {
                return {
                    id: fromSession.id,
                    exerciseId: fromSession.exerciseId,
                    name: fromSession.name,
                    originalName: fromSession.originalName,
                    bodyPart: fromSession.bodyPart,
                    target: fromSession.target,
                    equipment: fromSession.equipment,
                    category: fromSession.category,
                    gifUrl: fromSession.gifUrl,
                    isCustom: fromSession.isCustom,
                    updatedAt: fromSession.updatedAt,
                    deletedAt: fromSession.deletedAt,
                };
            }
            return resolveTrackedExercise(trackedId);
        },
        [exercises],
    );

    const editExercise = editEntry
        ? resolveExercise(editEntry.trackedExerciseId)
        : undefined;

    const addExercise = addPerf
        ? resolveExercise(addPerf.trackedExerciseId)
        : undefined;

    const addInitialWeightReps = useMemo(() => {
        if (!addPerf) return { weight: 20, reps: 8 };
        const sameDay = entries.filter(
            (entry) =>
                entry.date === addPerf.date &&
                entry.trackedExerciseId === addPerf.trackedExerciseId,
        );
        const newestSameDay = sameDay.reduce<PerformanceEntry | undefined>(
            (best, entry) =>
                !best ||
                    new Date(entry.createdAt).getTime() > new Date(best.createdAt).getTime()
                    ? entry
                    : best,
            undefined,
        );
        const latestAny = entries.find(
            (entry) => entry.trackedExerciseId === addPerf.trackedExerciseId,
        );
        return {
            weight: newestSameDay?.weight ?? latestAny?.weight ?? 20,
            reps: newestSameDay?.reps ?? latestAny?.reps ?? 8,
        };
    }, [addPerf, entries]);

    const ownerName = session
        ? getProfileDisplayName(
            {
                firstName: session.owner.firstName ?? undefined,
                lastName: session.owner.lastName ?? undefined,
                username: session.owner.username ?? undefined,
            },
            null,
        )
        : UI.sessionTitle;

    const pageTitle = isOwner ? UI.sessionTitleMine : UI.sessionTitleFriend.replace("{name}", ownerName);
    const dateLabel = date ? formatDayHeading(date) : "";

    const refreshSession = useCallback(async () => {
        if (!ownerUserId || !date) return;
        await mutate(sessionSwrKey(ownerUserId, date));
    }, [ownerUserId, date, mutate]);

    if (!ownerUserId || !date) {
        return (
            <div className="min-h-screen-app bg-background">
                <BackHeader title={UI.sessionTitle} />
                <main className="mx-auto max-w-2xl p-4">
                    <p className="text-sm text-destructive">{UI.sessionUnavailable}</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader
                title={pageTitle}
                description={dateLabel}
                right={
                    session?.isLive ? (
                        <Badge variant="secondary" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            <Radio className="size-3" aria-hidden />
                            {UI.sessionLiveBadge}
                        </Badge>
                    ) : null
                }
            />

            <main className="mx-auto max-w-2xl space-y-4 p-4">
                {isLoading ? (
                    <HistoryPageSkeleton />
                ) : error ? (
                    <p className="text-sm text-destructive">{UI.sessionUnavailable}</p>
                ) : (
                    <>
                        {session ? (
                            <p className="text-xs text-muted-foreground">
                                {sessionSummaryLine}
                            </p>
                        ) : null}

                        {dayGroups.length > 0 ? (
                            <ul className="space-y-8">
                                {dayGroups.map(({ date: dayKey, exercises: dayExercises }) => (
                                    <HistoryDaySection
                                        key={dayKey}
                                        dayKey={dayKey}
                                        hideDayHeading
                                        exercises={dayExercises}
                                        resolveExercise={resolveExercise}
                                        isTrackedActive={(trackedId) =>
                                            exercises.some(
                                                (exercise) => exercise.id === trackedId && !exercise.deletedAt,
                                            )
                                        }
                                        entryInsights={entryInsights}
                                        readOnly={!isOwner}
                                        onEditEntry={isOwner ? setEditEntry : () => { }}
                                        onDeleteEntry={
                                            isOwner
                                                ? (entry) => {
                                                    if (confirm(UI.confirmDeletePerf)) {
                                                        void (async () => {
                                                            await deletePerformanceAndWait(entry.id);
                                                            await refreshSession();
                                                        })();
                                                    }
                                                }
                                                : () => { }
                                        }
                                        onAddEntry={
                                            isOwner
                                                ? (trackedExerciseId, day) =>
                                                    setAddPerf({ trackedExerciseId, date: day })
                                                : undefined
                                        }
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">{UI.sessionEmpty}</p>
                        )}

                        <SessionCommentsThread
                            ownerUserId={ownerUserId}
                            date={date}
                            currentUserId={currentUserId}
                        />
                    </>
                )}
            </main>

            {isOwner && editEntry && editExercise ? (
                <AddPerfDrawer
                    open
                    onOpenChange={(open) => !open && setEditEntry(null)}
                    exercise={{
                        id: editExercise.id,
                        name: editExercise.name,
                        originalName: editExercise.originalName,
                        equipment: editExercise.equipment,
                        target: editExercise.target,
                    }}
                    initialWeight={editEntry.weight}
                    initialReps={editEntry.reps}
                    entryId={editEntry.id}
                    onUpdate={(entryId, weight, reps) => {
                        void (async () => {
                            await updatePerformanceAndWait(entryId, weight, reps);
                            await refreshSession();
                            setEditEntry(null);
                        })();
                    }}
                />
            ) : null}

            {isOwner && addPerf && addExercise ? (
                <AddPerfDrawer
                    open
                    onOpenChange={(open) => !open && setAddPerf(null)}
                    exercise={{
                        id: addExercise.id,
                        name: addExercise.name,
                        originalName: addExercise.originalName,
                        equipment: addExercise.equipment,
                        target: addExercise.target,
                    }}
                    initialWeight={addInitialWeightReps.weight}
                    initialReps={addInitialWeightReps.reps}
                    onSave={(weight, reps) => {
                        const prevPB = getPersonalBest(addPerf.trackedExerciseId) ?? null;
                        void (async () => {
                            try {
                                const { xp } = await savePerformanceAndWait(
                                    addPerf.trackedExerciseId,
                                    weight,
                                    reps,
                                    { date: addPerf.date },
                                );
                                notifyXpGrants(xp);
                                const nextPB =
                                    getPersonalBest(addPerf.trackedExerciseId) ?? null;
                                notifyPerfMilestones({
                                    exerciseName: addExercise.name,
                                    prevPB,
                                    nextPB,
                                    savedWeight: weight,
                                    savedReps: reps,
                                    league: xp?.league,
                                    exerciseImageUrl:
                                        getExerciseImageUrl(addExercise.gifUrl) || undefined,
                                    bodyPart: addExercise.bodyPart,
                                    target: addExercise.target,
                                });
                            } finally {
                                await refreshSession();
                                setAddPerf(null);
                            }
                        })();
                    }}
                />
            ) : null}
        </div>
    );
}
