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
  buildEntryInsights,
  groupByDayThenExercise,
  resolveTrackedExercise,
} from "@/lib/history-entries";
import { computeLeagueFromPB, notifyPerfMilestones } from "@/lib/perf-notifications";
import { notifyXpGrants } from "@/lib/xp-notifications";
import {
  profileSectionClass,
} from "@/lib/profile-section";
import {
  deletePerformanceAndWait,
  getPersonalBest,
  savePerformanceAndWait,
  updatePerformanceAndWait,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import type { PerformanceEntry } from "@/types";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/** Nombre max de perfs affichées sur le profil (le reste via Historique). */
const PROFILE_RECENT_MAX = 50;

export function ProfileRecentHistory() {
  const { data: allEntries = [] } = usePerformanceEntriesData();
  const { data: tracked = [] } = useTrackedExercisesData();
  const { data: profile } = useUserProfileData();
  const refreshAfterPerfChange = usePerformanceDataRefresh();

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

  const shown = useMemo(() => entries.slice(0, PROFILE_RECENT_MAX), [entries]);
  const shownByDayThenExercise = useMemo(
    () => groupByDayThenExercise(shown),
    [shown],
  );
  const truncated = entries.length > PROFILE_RECENT_MAX;

  const entryInsights = useMemo(
    () =>
      buildEntryInsights(
        entries,
        profile ?? { weightKg: 75, heightCm: 175, gender: "male" },
      ),
    [entries, profile],
  );

  const [editEntry, setEditEntry] = useState<PerformanceEntry | null>(null);
  const [addPerf, setAddPerf] = useState<{
    date: string;
    trackedExerciseId: string;
  } | null>(null);

  const editExercise = editEntry
    ? resolveTrackedExercise(editEntry.trackedExerciseId)
    : undefined;

  const addExercise = addPerf
    ? resolveTrackedExercise(addPerf.trackedExerciseId)
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
      <section className={profileSectionClass}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">
            {UI.profileRecentHistory}
          </h2>
          <Link
            to="/history"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {UI.profileHistorySeeAll}
          </Link>
        </div>

        {truncated ? (
          <p className="mb-4 text-xs text-muted-foreground">
            {UI.historyTruncated
              .replace("{shown}", String(PROFILE_RECENT_MAX))
              .replace("{total}", String(entries.length))}
          </p>
        ) : null}

        <ul className="space-y-8">
          {shownByDayThenExercise.map(({ date: dayKey, exercises }) => (
            <HistoryDaySection
              key={dayKey}
              dayKey={dayKey}
              surface="profile"
              exercises={exercises}
              resolveExercise={resolveTrackedExercise}
              isTrackedActive={(id) =>
                tracked.some((exercise) => exercise.id === id && !exercise.deletedAt)
              }
              entryInsights={entryInsights}
              onEditEntry={setEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onAddEntry={(trackedExerciseId, dayKey) =>
                setAddPerf({ trackedExerciseId, date: dayKey })
              }
            />
          ))}
        </ul>
      </section>

      {editEntry && editExercise ? (
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

      {addPerf && addExercise && profile ? (
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
            const prevLeague = computeLeagueFromPB({
              exercise: addExercise,
              personalBest: prevPB,
              profile,
            });
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
                const nextLeague = computeLeagueFromPB({
                  exercise: addExercise,
                  personalBest: nextPB,
                  profile,
                });
                notifyPerfMilestones({
                  exerciseName: addExercise.name,
                  prevPB,
                  nextPB,
                  savedWeight: weight,
                  savedReps: reps,
                  prevLeague,
                  nextLeague,
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
