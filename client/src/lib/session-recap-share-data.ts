import type {
  SessionRecapShareMuscle,
  SessionRecapSharePayload,
  SessionRecapShareVariant,
} from "@/components/share/SessionRecapShareCard";
import { muscleTargetToSlug } from "@/lib/muscle-target-to-slug";
import type { WorkoutSession } from "@/lib/session-api";
import { translateTarget } from "@/lib/translations";

const MAX_RECORDS = 3;

type SessionEntry = WorkoutSession["entries"][number];

function exerciseName(session: WorkoutSession, trackedExerciseId: string) {
  return (
    session.exercises.find((exercise) => exercise.id === trackedExerciseId)
      ?.name ?? ""
  );
}

/** Une série la plus lourde par exercice record, les plus lourds d'abord. */
function bestRecordEntries(session: WorkoutSession): SessionEntry[] {
  const bestByExercise = new Map<string, SessionEntry>();
  for (const entry of session.entries) {
    if (entry.deletedAt || !entry.leagueInsight?.isRecord) continue;
    const current = bestByExercise.get(entry.trackedExerciseId);
    if (
      !current ||
      entry.weight > current.weight ||
      (entry.weight === current.weight && entry.reps > current.reps)
    ) {
      bestByExercise.set(entry.trackedExerciseId, entry);
    }
  }
  return [...bestByExercise.values()].sort(
    (a, b) => b.weight - a.weight || b.reps - a.reps,
  );
}

function buildMuscles(session: WorkoutSession): SessionRecapShareMuscle[] {
  const bySlug = new Map<
    SessionRecapShareMuscle["slug"],
    SessionRecapShareMuscle
  >();
  for (const entry of session.entries) {
    if (entry.deletedAt) continue;
    const target = session.exercises.find(
      (exercise) => exercise.id === entry.trackedExerciseId,
    )?.target;
    const slug = target ? muscleTargetToSlug(target) : undefined;
    if (!target || !slug) continue;
    const current = bySlug.get(slug);
    if (current) current.sets += 1;
    else bySlug.set(slug, { slug, label: translateTarget(target), sets: 1 });
  }
  return [...bySlug.values()].sort((a, b) => b.sets - a.sets);
}

export function buildSessionRecapSharePayload(
  session: WorkoutSession,
  extra: { dateLabel: string; volume: number; durationLabel: string },
): SessionRecapSharePayload {
  const records = bestRecordEntries(session);
  return {
    dateLabel: extra.dateLabel,
    volume: extra.volume,
    durationLabel: extra.durationLabel,
    setCount: session.setCount,
    recordCount: records.length,
    muscles: buildMuscles(session),
    records: records.slice(0, MAX_RECORDS).map((entry) => ({
      name: exerciseName(session, entry.trackedExerciseId),
      weight: entry.weight,
      reps: entry.reps,
    })),
  };
}

export const RECAP_SHARE_VARIANTS: SessionRecapShareVariant[] = [
  "stats",
  "muscles",
  "records",
];

/** Un sticker n'est proposé que si la séance a de quoi le remplir. */
export function isRecapVariantAvailable(
  payload: SessionRecapSharePayload,
  variant: SessionRecapShareVariant,
): boolean {
  switch (variant) {
    case "muscles":
      return payload.muscles.length > 0;
    case "records":
      return payload.records.length > 0;
    default:
      return true;
  }
}
