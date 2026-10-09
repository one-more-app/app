import { AddPerfDrawer } from "@/components/AddPerfDrawer";
import { HomeDayTitle } from "@/components/home/HomeDayTitle";
import { HomeExerciseList } from "@/components/home/HomeExerciseList";
import { SessionCommentsThread } from "@/components/session/SessionCommentsThread";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePerformanceDataRefresh } from "@/hooks/use-api-data";
import { useHomeData } from "@/hooks/use-home-data";
import { useHomeDaySession } from "@/hooks/use-home-day-session";
import { useSessionLive } from "@/hooks/use-session-live";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { CARDIO_EQUIPMENT, getExerciseImageUrl } from "@/lib/exercisedb";
import { formatSessionChrono } from "@/lib/format-session-chrono";
import { hapticImpact } from "@/lib/haptics";
import {
  chronologicalPerfOrder,
  entryInsightsFromPerformances,
  resolveTrackedExercise,
} from "@/lib/history-entries";
import { notifyPerfMilestones } from "@/lib/perf-notifications";
import {
  applySessionReactionTarget,
  sessionSwrKey,
  toggleSessionReaction,
} from "@/lib/session-api";
import {
  getPersonalBest,
  savePerformanceAndWait,
  updatePerformanceAndWait,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { notifyXpGrants } from "@/lib/xp-notifications";
import type { PerformanceEntry, TrackedExercise } from "@/types";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type HomeLiveSessionProps = {
  ownerUserId: string;
  dayKey: string;
  /** Perfs actives du jour (locales + distantes). */
  todayEntries: PerformanceEntry[];
  onAddExercise: () => void;
};

type ExerciseGroup = {
  trackedExerciseId: string;
  /** Séries dans l'ordre chronologique. */
  items: PerformanceEntry[];
};

/** Exercices dans l'ordre de première série du jour (stable quand on ajoute une série). */
function groupTodayByExercise(entries: PerformanceEntry[]): ExerciseGroup[] {
  const map = new Map<string, PerformanceEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.trackedExerciseId) ?? [];
    list.push(entry);
    map.set(entry.trackedExerciseId, list);
  }
  return [...map.entries()]
    .map(([trackedExerciseId, items]) => ({
      trackedExerciseId,
      items: [...items].sort(chronologicalPerfOrder),
    }))
    .sort(
      (a, b) =>
        new Date(a.items[0]!.createdAt).getTime() -
        new Date(b.items[0]!.createdAt).getTime(),
    );
}

function LiveChrono({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-one-more text-lg italic tabular-nums">
      {formatSessionChrono(now - startedAt)}
    </span>
  );
}

/**
 * Séance du jour en cours : liste des exercices du jour, séries dépliables,
 * ajout et modification de perf via le tiroir, commentaires s'il y en a.
 */
export function HomeLiveSession({
  ownerUserId,
  dayKey,
  todayEntries,
  onAddExercise,
}: HomeLiveSessionProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUserId =
    auth.status === "authenticated" ? (auth.user?.id ?? null) : null;
  const { mutate } = useSWRConfig();
  const { exercises: homeExercises } = useHomeData();
  const refreshAfterPerfChange = usePerformanceDataRefresh();
  const { data: session } = useHomeDaySession(ownerUserId, dayKey);
  useSessionLive(ownerUserId, dayKey);

  const { timing } = useSessionTiming(todayEntries, {
    dayKey,
    endedAt: session?.endedAt,
  });

  const [addFor, setAddFor] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<PerformanceEntry | null>(null);

  const sessionExercises = useMemo(() => session?.exercises ?? [], [session]);
  const entryInsights = useMemo(
    () => entryInsightsFromPerformances(session?.entries ?? []),
    [session],
  );

  const resolveExercise = useCallback(
    (trackedId: string): TrackedExercise | undefined => {
      const fromHome = homeExercises.find((ex) => ex.id === trackedId);
      if (fromHome) return fromHome;
      const fromSession = sessionExercises.find((ex) => ex.id === trackedId);
      if (fromSession) return fromSession;
      return resolveTrackedExercise(trackedId);
    },
    [homeExercises, sessionExercises],
  );

  const resolveLeague = useCallback(
    (trackedId: string) =>
      homeExercises.find((ex) => ex.id === trackedId)?.league ??
      sessionExercises.find((ex) => ex.id === trackedId)?.league ??
      null,
    [homeExercises, sessionExercises],
  );

  const groups = useMemo(
    () =>
      groupTodayByExercise(todayEntries).filter(({ trackedExerciseId }) => {
        const ex = resolveExercise(trackedExerciseId);
        if (!ex) return true;
        return (
          (ex.bodyPart || ex.target) !== "cardio" &&
          !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment))
        );
      }),
    [todayEntries, resolveExercise],
  );

  const refreshSession = useCallback(async () => {
    await Promise.all([
      mutate(sessionSwrKey(ownerUserId, dayKey)),
      refreshAfterPerfChange(),
    ]);
  }, [mutate, ownerUserId, dayKey, refreshAfterPerfChange]);

  const handleToggleReaction = useCallback(
    async (trackedExerciseId: string, emoji: string) => {
      try {
        const { target } = await toggleSessionReaction(ownerUserId, dayKey, {
          emoji,
          targetType: "exercise",
          trackedExerciseId,
        });
        void mutate(
          sessionSwrKey(ownerUserId, dayKey),
          (current) =>
            current ? applySessionReactionTarget(current, target) : current,
          { revalidate: false },
        );
      } catch {
        toast.error(UI.sessionReactionError);
      }
    },
    [ownerUserId, dayKey, mutate],
  );

  const addExercise = addFor ? resolveExercise(addFor) : undefined;
  const editExercise = editEntry
    ? resolveExercise(editEntry.trackedExerciseId)
    : undefined;

  const addInitial = useMemo(() => {
    if (!addFor) return { weight: 20, reps: 8 };
    const sameDay = groups.find((g) => g.trackedExerciseId === addFor)?.items;
    const last = sameDay?.[sameDay.length - 1];
    const fallback = resolveExercise(addFor) as
      | { lastPerf?: PerformanceEntry | null }
      | undefined;
    return {
      weight: last?.weight ?? fallback?.lastPerf?.weight ?? 20,
      reps: last?.reps ?? fallback?.lastPerf?.reps ?? 8,
    };
  }, [addFor, groups, resolveExercise]);

  const hasComments = (session?.commentCount ?? 0) > 0;

  return (
    <section data-tour="home-today" className="space-y-4">
      <div>
        <HomeDayTitle
          right={
            timing ? <LiveChrono startedAt={new Date(timing.startedAt).getTime()} /> : null
          }
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
          />
          {UI.homeSessionInProgress}
        </HomeDayTitle>

        <HomeExerciseList
          mode="live"
          groups={groups.map(({ trackedExerciseId, items }) => {
            const exercise = resolveExercise(trackedExerciseId);
            const seriesLabel =
              items.length === 1
                ? UI.homeLiveSeriesOne
                : UI.historySeriesCount.replace(
                    "{count}",
                    String(items.length),
                  );
            return {
              trackedExerciseId,
              items,
              exercise,
              league: resolveLeague(trackedExerciseId),
              seriesLabel,
              reactions:
                session?.reactionsByExerciseId?.[trackedExerciseId],
            };
          })}
          entryInsights={entryInsights}
          onOpenExercise={(id) => {
            void hapticImpact();
            navigate(`/exercise/${id}`);
          }}
          onAddSet={(id) => {
            void hapticImpact();
            setAddFor(id);
          }}
          onEditEntry={setEditEntry}
          currentUserId={currentUserId}
          onToggleReaction={(id, emoji) => {
            void hapticImpact();
            void handleToggleReaction(id, emoji);
          }}
        />
      </div>

      <Button
        type="button"
        onClick={onAddExercise}
        className="h-12 w-full rounded-xl bg-black font-one-more text-sm font-semibold uppercase italic tracking-tight text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
      >
        <Plus className="size-4" aria-hidden />
        {UI.addExercise}
      </Button>

      {hasComments ? (
        <SessionCommentsThread
          ownerUserId={ownerUserId}
          date={dayKey}
          currentUserId={currentUserId}
        />
      ) : null}

      {addFor && addExercise ? (
        <AddPerfDrawer
          open
          onOpenChange={(open) => !open && setAddFor(null)}
          exercise={{
            id: addExercise.id,
            name: addExercise.name,
            originalName: addExercise.originalName,
            equipment: addExercise.equipment,
            target: addExercise.target,
          }}
          initialWeight={addInitial.weight}
          initialReps={addInitial.reps}
          onSave={(weight, reps) => {
            const prevPB = getPersonalBest(addFor) ?? null;
            void (async () => {
              try {
                const { xp } = await savePerformanceAndWait(
                  addFor,
                  weight,
                  reps,
                  { date: dayKey },
                );
                notifyXpGrants(xp);
                const nextPB = getPersonalBest(addFor) ?? null;
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
                setAddFor(null);
              }
            })();
          }}
        />
      ) : null}

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
              try {
                await updatePerformanceAndWait(entryId, weight, reps);
              } finally {
                await refreshSession();
                setEditEntry(null);
              }
            })();
          }}
        />
      ) : null}
    </section>
  );
}
