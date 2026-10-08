import { ExerciseCard } from "@/components/ExerciseCard";
import { HomeDayTitle } from "@/components/home/HomeDayTitle";
import { SessionTimingLabel } from "@/components/session/SessionTimingLabel";
import { usePerformanceDataRefresh } from "@/hooks/use-api-data";
import { useHomeData, type ExerciseWithPerf } from "@/hooks/use-home-data";
import { sortBrowseableByLatestPerf } from "@/lib/exercise-catalog-browse";
import { CARDIO_EQUIPMENT, getExerciseImageUrl } from "@/lib/exercisedb";
import { filterExercisesDoneToday } from "@/lib/home-today-exercises";
import { notifyPerfMilestones } from "@/lib/perf-notifications";
import {
  getLatestPerformanceCreatedAt,
  getPersonalBest,
  savePerformanceAndWait,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { notifyXpGrants } from "@/lib/xp-notifications";
import type { PerformanceEntry } from "@/types";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

type HomeLiveSessionProps = {
  ownerUserId: string;
  dayKey: string;
  todayEntries: PerformanceEntry[];
};

/**
 * Séance du jour en cours (version simplifiée du lot 1).
 * Liste compacte des exercices du jour ; liste dépliable et ajout de série
 * inline arrivent au lot 2.
 */
export function HomeLiveSession({
  ownerUserId,
  dayKey,
  todayEntries,
}: HomeLiveSessionProps) {
  const navigate = useNavigate();
  const { exercises } = useHomeData();
  const refreshAfterPerfChange = usePerformanceDataRefresh();

  const todayExercises = useMemo(
    () =>
      sortBrowseableByLatestPerf(
        filterExercisesDoneToday(
          exercises.filter(
            (ex) =>
              (ex.bodyPart || ex.target) !== "cardio" &&
              !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)),
          ),
          dayKey,
        ),
        (id: string) => getLatestPerformanceCreatedAt(id),
      ),
    // todayEntries : recalcul quand une perf du jour est ajoutée ou modifiée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises, dayKey, todayEntries],
  );

  const renderCard = useCallback(
    (ex: ExerciseWithPerf) => (
      <ExerciseCard
        compact
        exercise={ex}
        lastPerf={ex.lastPerf}
        personalBest={ex.personalBest}
        leagueInfo={ex.league ?? null}
        onClick={() => navigate(`/exercise/${ex.id}`)}
        onSavePerf={(weight, reps) => {
          const prevPB = ex.personalBest ?? null;
          void (async () => {
            try {
              const { xp } = await savePerformanceAndWait(ex.id, weight, reps);
              notifyXpGrants(xp);
              const nextPB = getPersonalBest(ex.id) ?? null;
              notifyPerfMilestones({
                exerciseName: ex.name,
                prevPB,
                nextPB,
                savedWeight: weight,
                savedReps: reps,
                league: xp?.league,
                exerciseImageUrl: getExerciseImageUrl(ex.gifUrl) || undefined,
                bodyPart: ex.bodyPart,
                target: ex.target,
              });
              navigate(`/exercise/${ex.id}`);
            } finally {
              void refreshAfterPerfChange();
            }
          })();
        }}
      />
    ),
    [navigate, refreshAfterPerfChange],
  );

  return (
    <section data-tour="home-today">
      <HomeDayTitle
        right={
          <SessionTimingLabel
            entries={todayEntries}
            dayKey={dayKey}
            className="text-sm"
          />
        }
      >
        <span
          aria-hidden
          className="size-2.5 shrink-0 animate-pulse rounded-full bg-orange-500 motion-reduce:animate-none"
        />
        {UI.homeSessionInProgress}
      </HomeDayTitle>

      <ul className="space-y-3">
        {todayExercises.map((ex) => (
          <li key={ex.id}>{renderCard(ex)}</li>
        ))}
      </ul>

      <Link
        to={`/session/${ownerUserId}/${dayKey}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        {UI.homeViewLiveSession}
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
