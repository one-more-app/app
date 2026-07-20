import { apiFetch } from "@/lib/api";
import type { EventExerciseSlug, EventGenderSlug } from "@/lib/event-constants";

export type EventLeaderboardRow = {
  id: string;
  firstName: string;
  displayName: string;
  reps: number;
  rank: number;
};

export type EventLeaderboardBoard = Record<
  EventExerciseSlug,
  Record<EventGenderSlug, EventLeaderboardRow[]>
>;

export type EventExerciseMedia = {
  gifUrl: string | null;
  name: string;
  nameFr: string | null;
};

export type EventActiveCelebration = {
  entryId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  reps: number;
  exercise: EventExerciseSlug;
  gender: EventGenderSlug;
};

export type EventLeaderboardResponse = {
  board: EventLeaderboardBoard;
  exerciseMedia: Record<EventExerciseSlug, EventExerciseMedia>;
  activeCelebration: EventActiveCelebration | null;
};

export type EventRecentEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: EventGenderSlug;
  exercise: EventExerciseSlug;
  reps: number;
  notes: string | null;
  beatPreviousLeader: boolean;
  tshirtAwarded: boolean;
  rank: number;
  createdAt: string;
};

export type CreateEventEntryPayload = {
  firstName: string;
  lastName: string;
  email: string;
  gender: EventGenderSlug;
  exercise: EventExerciseSlug;
  reps: number;
  notes?: string;
};

export type CreateEventEntryResponse = {
  entry: {
    id: string;
    firstName: string;
    gender: EventGenderSlug;
    exercise: EventExerciseSlug;
    reps: number;
    beatPreviousLeader: boolean;
    tshirtAwarded: boolean;
    celebrationPending: boolean;
    rank: number;
    createdAt: string;
  };
};

export async function fetchEventLeaderboard(): Promise<EventLeaderboardResponse> {
  return apiFetch<EventLeaderboardResponse>("/public/event/leaderboard");
}

export async function dismissEventCelebration(): Promise<{ dismissed: boolean }> {
  return apiFetch<{ dismissed: boolean }>("/public/event/celebration/dismiss", {
    method: "POST",
  });
}

export async function fetchEventRecentEntries(): Promise<{ entries: EventRecentEntry[] }> {
  return apiFetch<{ entries: EventRecentEntry[] }>("/public/event/entries/recent");
}

export async function createEventEntry(
  payload: CreateEventEntryPayload,
): Promise<CreateEventEntryResponse> {
  return apiFetch<CreateEventEntryResponse>("/public/event/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
