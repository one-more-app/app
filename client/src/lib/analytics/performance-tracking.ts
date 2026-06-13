import { AnalyticsEvents } from "./events";
import { track } from "./track";
import { getTrackedExerciseById, getAllPerformanceEntries } from "@/lib/storage";

function exerciseContext(trackedExerciseId: string) {
  const exercise = getTrackedExerciseById(trackedExerciseId);
  return {
    tracked_exercise_id: trackedExerciseId,
    exercise_name: exercise?.name,
    is_custom: exercise?.isCustom ?? false,
  };
}

export function trackPerformanceLogged(params: {
  trackedExerciseId: string;
  entryId: string;
  weight: number;
  reps: number;
  date: string;
  source?: string;
}): void {
  track(AnalyticsEvents.PERFORMANCE_LOGGED, {
    ...exerciseContext(params.trackedExerciseId),
    entry_id: params.entryId,
    weight: params.weight,
    reps: params.reps,
    date: params.date,
    source: params.source ?? "app",
  });
}

export function trackPerformanceEdited(params: {
  entryId: string;
  weight: number;
  reps: number;
  previousWeight?: number;
  previousReps?: number;
  source?: string;
}): void {
  const entry = getAllPerformanceEntries().find((e) => e.id === params.entryId);
  track(AnalyticsEvents.PERFORMANCE_EDITED, {
    ...(entry
      ? exerciseContext(entry.trackedExerciseId)
      : { entry_id: params.entryId }),
    entry_id: params.entryId,
    weight: params.weight,
    reps: params.reps,
    previous_weight: params.previousWeight,
    previous_reps: params.previousReps,
    source: params.source ?? "app",
  });
}

export function trackPerformanceDeleted(params: {
  entryId: string;
  source?: string;
}): void {
  const entry = getAllPerformanceEntries().find((e) => e.id === params.entryId);
  track(AnalyticsEvents.PERFORMANCE_DELETED, {
    ...(entry
      ? {
          ...exerciseContext(entry.trackedExerciseId),
          weight: entry.weight,
          reps: entry.reps,
          date: entry.date,
        }
      : {}),
    entry_id: params.entryId,
    source: params.source ?? "app",
  });
}

export function trackPersonalRecordBroken(params: {
  exerciseName: string;
  weight: number;
  reps: number;
  previousWeight?: number;
  previousReps?: number;
  leagueTier?: string;
}): void {
  track(AnalyticsEvents.PERSONAL_RECORD_BROKEN, {
    exercise_name: params.exerciseName,
    weight: params.weight,
    reps: params.reps,
    previous_weight: params.previousWeight,
    previous_reps: params.previousReps,
    league_tier: params.leagueTier,
  });
}

export function trackLeaguePromoted(params: {
  exerciseName: string;
  weight: number;
  reps: number;
  previousRankId?: string;
  nextRankId: string;
  nextTier: string;
}): void {
  track(AnalyticsEvents.LEAGUE_PROMOTED, {
    exercise_name: params.exerciseName,
    weight: params.weight,
    reps: params.reps,
    previous_rank_id: params.previousRankId,
    next_rank_id: params.nextRankId,
    next_tier: params.nextTier,
  });
}

export function trackRestTimerDismissed(params: {
  elapsedMs: number;
  trackedExerciseId?: string;
}): void {
  track(AnalyticsEvents.REST_TIMER_DISMISSED, {
    elapsed_ms: params.elapsedMs,
    elapsed_seconds: Math.round(params.elapsedMs / 1000),
    ...(params.trackedExerciseId
      ? exerciseContext(params.trackedExerciseId)
      : {}),
  });
}

export function trackPerfDrawerOpened(params: {
  mode: "add" | "edit";
  trackedExerciseId: string;
  initialWeight: number;
  initialReps: number;
}): void {
  track(AnalyticsEvents.PERF_DRAWER_OPENED, {
    mode: params.mode,
    ...exerciseContext(params.trackedExerciseId),
    initial_weight: params.initialWeight,
    initial_reps: params.initialReps,
  });
}
