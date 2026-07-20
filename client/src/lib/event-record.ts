import type { EventExerciseSlug, EventGenderSlug } from "@/lib/event-constants";
import type { EventLeaderboardBoard } from "@/lib/event-api";

export type EventRecordToBeat = {
  reps: number;
};

export function getEventRecordToBeat(
  board: EventLeaderboardBoard | null | undefined,
  exercise: EventExerciseSlug,
  gender: EventGenderSlug,
): EventRecordToBeat | null {
  const top = board?.[exercise]?.[gender]?.[0];
  if (!top) return null;
  return { reps: top.reps };
}

export function isLiveBeatingRecord(
  reps: number,
  record: EventRecordToBeat | null,
): boolean {
  return record != null && reps > record.reps;
}

export function liveRecordProgressPercent(
  reps: number,
  record: EventRecordToBeat | null,
): number {
  if (!record) return reps > 0 ? 100 : 0;
  const target = record.reps + 1;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((reps / target) * 100));
}
