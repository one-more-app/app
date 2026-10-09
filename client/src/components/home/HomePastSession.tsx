import { HomeDayTitle } from "@/components/home/HomeDayTitle";
import { HomeExerciseList } from "@/components/home/HomeExerciseList";
import { HomeRecapTeaser } from "@/components/home/HomeRecapTeaser";
import { SessionCommentsThread } from "@/components/session/SessionCommentsThread";
import { ExerciseCardSkeletonList } from "@/components/skeletons";
import { useAuth } from "@/hooks/use-auth";
import { useHomeDaySession } from "@/hooks/use-home-day-session";
import {
  entryInsightsFromPerformances,
  formatTimeOnly,
  groupByDayThenExercise,
  resolveTrackedExercise,
} from "@/lib/history-entries";
import { hapticImpact } from "@/lib/haptics";
import { formatCompactDuration, formatHomeDayTitle } from "@/lib/home-day";
import { getLocalDateKey } from "@/lib/local-date";
import {
  applySessionReactionTarget,
  sessionSwrKey,
  toggleSessionReaction,
} from "@/lib/session-api";
import { UI } from "@/lib/translations";
import type { PerformanceEntry } from "@/types";
import { computeSessionTiming } from "@one-more/shared/session-timing";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type HomePastSessionProps = {
  ownerUserId: string;
  dayKey: string;
  /** Perfs locales du jour (affichage immédiat des horaires et de la durée). */
  dayEntries: PerformanceEntry[];
  /** Toutes les perfs locales (mini graphique du teaser). */
  allEntries: PerformanceEntry[];
};

export function HomePastSession({
  ownerUserId,
  dayKey,
  dayEntries,
  allEntries,
}: HomePastSessionProps) {
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const auth = useAuth();
  const currentUserId =
    auth.status === "authenticated" ? (auth.user?.id ?? null) : null;
  const { data: session, isLoading, error } = useHomeDaySession(
    ownerUserId,
    dayKey,
  );

  const timing = useMemo(
    () =>
      computeSessionTiming(dayEntries, {
        dayKey,
        todayKey: getLocalDateKey(),
        endedAt: session?.endedAt,
      }),
    [dayEntries, dayKey, session?.endedAt],
  );

  const sessionEntries = useMemo(() => session?.entries ?? [], [session]);
  const sessionExercises = useMemo(
    () => session?.exercises ?? [],
    [session],
  );

  const dayGroups = useMemo(
    () => groupByDayThenExercise(sessionEntries),
    [sessionEntries],
  );
  const entryInsights = useMemo(
    () => entryInsightsFromPerformances(sessionEntries),
    [sessionEntries],
  );

  const resolveExercise = useCallback(
    (trackedId: string) => {
      const fromSession = sessionExercises.find(
        (exercise) => exercise.id === trackedId,
      );
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
    [sessionExercises],
  );

  const pastGroups = useMemo(
    () =>
      dayGroups.flatMap(({ exercises }) =>
        exercises.map(({ trackedExerciseId, items }) => {
          const fromSession = sessionExercises.find(
            (exercise) => exercise.id === trackedExerciseId,
          );
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
            exercise: resolveExercise(trackedExerciseId),
            league: fromSession?.league ?? null,
            seriesLabel,
          };
        }),
      ),
    [dayGroups, resolveExercise, sessionExercises],
  );

  const handleToggleReaction = useCallback(
    async (emoji: string) => {
      try {
        const { target } = await toggleSessionReaction(ownerUserId, dayKey, {
          emoji,
          targetType: "session",
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

  const exerciseCount = useMemo(
    () => new Set(dayEntries.map((entry) => entry.trackedExerciseId)).size,
    [dayEntries],
  );

  return (
    <section className="space-y-4">
      <HomeDayTitle
        right={
          timing ? (
            <span className="flex items-baseline gap-2">
              {timing.endedAt ? (
                <span className="text-xs text-muted-foreground">
                  {UI.homeSessionTimeRange
                    .replace("{start}", formatTimeOnly(timing.startedAt))
                    .replace("{end}", formatTimeOnly(timing.endedAt))}
                </span>
              ) : null}
              <span className="font-one-more text-base italic tabular-nums">
                {formatCompactDuration(timing.durationMs)}
              </span>
            </span>
          ) : null
        }
      >
        {formatHomeDayTitle(dayKey)}
      </HomeDayTitle>

      <HomeRecapTeaser
        ownerUserId={ownerUserId}
        dayKey={dayKey}
        entries={allEntries}
        exerciseCount={exerciseCount}
      />

      {isLoading && !session ? (
        <ExerciseCardSkeletonList count={3} compact />
      ) : error && !session ? (
        <p className="text-sm text-muted-foreground">{UI.sessionUnavailable}</p>
      ) : (
        <HomeExerciseList
          mode="past"
          groups={pastGroups}
          entryInsights={entryInsights}
          onOpenExercise={(id) => {
            void navigate(`/exercise/${id}`);
          }}
        />
      )}

      {session && session.commentCount > 0 ? (
        <SessionCommentsThread
          ownerUserId={ownerUserId}
          date={dayKey}
          currentUserId={currentUserId}
          reactions={session.reactions ?? []}
          onToggleReaction={(emoji) => {
            void hapticImpact();
            void handleToggleReaction(emoji);
          }}
        />
      ) : null}
    </section>
  );
}
