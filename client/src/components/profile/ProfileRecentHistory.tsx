import { AddPerfDrawer } from "@/components/AddPerfDrawer";
import { HistoryDaySection } from "@/components/history/HistoryDaySection";
import {
  usePerformanceDataRefresh,
  usePerformanceEntriesData,
  useTrackedExercisesData,
  useUserProfileData,
} from "@/hooks/use-api-data";
import { getExerciseImageUrl } from "@/lib/exercisedb";
import {
  entryInsightsFromPerformances,
  groupByDayThenExercise,
  resolveTrackedExercise,
} from "@/lib/history-entries";
import { notifyPerfMilestones } from "@/lib/perf-notifications";
import { notifyXpGrants } from "@/lib/xp-notifications";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deletePerformanceAndWait,
  getPersonalBest,
  savePerformanceAndWait,
  updatePerformanceAndWait,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import type { PerformanceEntry, TrackedExercise, UserProfile } from "@/types";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ProfileRecentHistoryProps = {
  entries?: PerformanceEntry[];
  tracked?: TrackedExercise[];
  profile?: UserProfile;
  readOnly?: boolean;
};

export function ProfileRecentHistory({
  entries: entriesProp,
  tracked: trackedProp,
  profile: profileProp,
  readOnly = false,
}: ProfileRecentHistoryProps = {}) {
  const { data: allEntriesFromHook = [] } = usePerformanceEntriesData({
    withLeagueInsights: true,
  });
  const { data: trackedFromHook = [] } = useTrackedExercisesData();
  const { data: profileFromHook } = useUserProfileData();
  const refreshAfterPerfChange = usePerformanceDataRefresh();

  const allEntries = entriesProp ?? allEntriesFromHook;
  const tracked = trackedProp ?? trackedFromHook;
  const profile = profileProp ?? profileFromHook;

  const resolveExercise = useCallback(
    (trackedId: string) => {
      if (trackedProp) {
        return trackedProp.find((exercise) => exercise.id === trackedId);
      }
      return resolveTrackedExercise(trackedId);
    },
    [trackedProp],
  );

  const entries = useMemo(
    () =>
      allEntries
        .filter((entry) => !entry.deletedAt)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allEntries],
  );

  const shown = useMemo(() => {
    if (entries.length === 0) return [];
    const latestDate = [...new Set(entries.map((e) => e.date))].sort((a, b) =>
      b.localeCompare(a),
    )[0]!;
    return entries.filter((e) => e.date === latestDate);
  }, [entries]);
  const shownByDayThenExercise = useMemo(
    () => groupByDayThenExercise(shown),
    [shown],
  );

  const entryInsights = useMemo(
    () => entryInsightsFromPerformances(allEntries),
    [allEntries],
  );

  const [editEntry, setEditEntry] = useState<PerformanceEntry | null>(null);
  const [addPerf, setAddPerf] = useState<{
    date: string;
    trackedExerciseId: string;
  } | null>(null);

  const editExercise = editEntry
    ? resolveExercise(editEntry.trackedExerciseId)
    : undefined;

  const addExercise = addPerf
    ? resolveExercise(addPerf.trackedExerciseId)
    : undefined;

  const addInitialWeightReps = useMemo(() => {
    if (!addPerf) return { weight: 20, reps: 8 };
    const sameDay = entries.filter(
      (e) =>
        e.date === addPerf.date &&
        e.trackedExerciseId === addPerf.trackedExerciseId,
    );
    const newestSameDay = sameDay.reduce<PerformanceEntry | undefined>(
      (best, e) =>
        !best ||
        new Date(e.createdAt).getTime() > new Date(best.createdAt).getTime()
          ? e
          : best,
      undefined,
    );
    const latestAny = entries.find(
      (e) => e.trackedExerciseId === addPerf.trackedExerciseId,
    );
    return {
      weight: newestSameDay?.weight ?? latestAny?.weight ?? 20,
      reps: newestSameDay?.reps ?? latestAny?.reps ?? 8,
    };
  }, [addPerf, entries]);

  const handleDeleteEntry = useCallback(
    (entry: PerformanceEntry) => {
      if (confirm(UI.confirmDeletePerf)) {
        void (async () => {
          await deletePerformanceAndWait(entry.id);
          await refreshAfterPerfChange();
        })();
      }
    },
    [refreshAfterPerfChange],
  );

  if (entries.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{UI.profileRecentHistory}</CardTitle>
          {!readOnly ? (
            <CardAction>
              <Link
                to="/history"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {UI.profileHistorySeeAll}
              </Link>
            </CardAction>
          ) : null}
        </CardHeader>

        <CardContent>
        <ul className="space-y-8">
          {shownByDayThenExercise.map(({ date: dayKey, exercises }) => (
            <HistoryDaySection
              key={dayKey}
              dayKey={dayKey}
              surface="profile"
              exercises={exercises}
              resolveExercise={resolveExercise}
              isTrackedActive={(id) =>
                tracked.some(
                  (exercise) => exercise.id === id && !exercise.deletedAt,
                )
              }
              entryInsights={entryInsights}
              readOnly={readOnly}
              onEditEntry={readOnly ? () => {} : setEditEntry}
              onDeleteEntry={readOnly ? () => {} : handleDeleteEntry}
              onAddEntry={
                readOnly
                  ? undefined
                  : (trackedExerciseId, day) =>
                      setAddPerf({ trackedExerciseId, date: day })
              }
            />
          ))}
        </ul>
        </CardContent>
      </Card>

      {!readOnly && editEntry && editExercise ? (
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
              await refreshAfterPerfChange();
              setEditEntry(null);
            })();
          }}
        />
      ) : null}

      {!readOnly && addPerf && addExercise && profile ? (
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
                });
              } finally {
                void refreshAfterPerfChange();
                setAddPerf(null);
              }
            })();
          }}
        />
      ) : null}
    </>
  );
}
