import { ApiError, apiFetch } from "@/lib/api";
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

export type EventActiveAttempt = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  gender: EventGenderSlug;
  exercise: EventExerciseSlug;
  notes: string | null;
  reps: number;
  startedAt: string;
};

export type EventAttemptResult = {
  entryId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  reps: number;
  exercise: EventExerciseSlug;
  gender: EventGenderSlug;
  rank: number;
  beatPreviousLeader: boolean;
};

export type EventLeaderboardResponse = {
  board: EventLeaderboardBoard;
  exerciseMedia: Record<EventExerciseSlug, EventExerciseMedia>;
  activeCelebration: EventActiveCelebration | null;
  activeAttempt: EventActiveAttempt | null;
  recentResult: EventAttemptResult | null;
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

export type StartEventAttemptPayload = {
  firstName: string;
  lastName: string;
  email: string;
  gender: EventGenderSlug;
  exercise: EventExerciseSlug;
  notes?: string;
};

export type FinalizeEventAttemptResponse = {
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
  attemptResult: EventAttemptResult;
};

const EVENT_ADMIN_PASSWORD_STORAGE_KEY = "one-more:event-admin-password";
export const EVENT_ADMIN_PASSWORD_HEADER = "X-Event-Admin-Password";

export function getEventAdminPassword(): string | null {
  try {
    const value = sessionStorage.getItem(EVENT_ADMIN_PASSWORD_STORAGE_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

export function setEventAdminPassword(password: string): void {
  sessionStorage.setItem(EVENT_ADMIN_PASSWORD_STORAGE_KEY, password);
}

export function clearEventAdminPassword(): void {
  try {
    sessionStorage.removeItem(EVENT_ADMIN_PASSWORD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function eventAdminHeaders(password?: string): HeadersInit {
  const value = password ?? getEventAdminPassword();
  if (!value) return {};
  return { [EVENT_ADMIN_PASSWORD_HEADER]: value };
}

export async function verifyEventAdminPassword(password: string): Promise<boolean> {
  try {
    await apiFetch<{ ok: true }>("/public/event/admin/auth", {
      method: "POST",
      headers: eventAdminHeaders(password),
    });
    setEventAdminPassword(password);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return false;
    }
    throw error;
  }
}

export async function fetchEventLeaderboard(): Promise<EventLeaderboardResponse> {
  return apiFetch<EventLeaderboardResponse>("/public/event/leaderboard");
}

export async function dismissEventAttemptResult(): Promise<{ dismissed: boolean }> {
  return apiFetch<{ dismissed: boolean }>("/public/event/attempt/result/dismiss", {
    method: "POST",
    headers: eventAdminHeaders(),
  });
}

export async function dismissEventTvDisplay(): Promise<{
  dismissedResult: boolean;
  dismissedCelebration: boolean;
}> {
  return apiFetch<{
    dismissedResult: boolean;
    dismissedCelebration: boolean;
  }>("/public/event/display/dismiss", {
    method: "POST",
    headers: eventAdminHeaders(),
  });
}

export async function dismissEventCelebration(): Promise<{ dismissed: boolean }> {
  return apiFetch<{ dismissed: boolean }>("/public/event/celebration/dismiss", {
    method: "POST",
    headers: eventAdminHeaders(),
  });
}

export async function fetchEventRecentEntries(): Promise<{ entries: EventRecentEntry[] }> {
  return apiFetch<{ entries: EventRecentEntry[] }>("/public/event/entries/recent", {
    headers: eventAdminHeaders(),
  });
}

export async function startEventAttempt(
  payload: StartEventAttemptPayload,
): Promise<{ attempt: EventActiveAttempt }> {
  return apiFetch<{ attempt: EventActiveAttempt }>("/public/event/attempt/start", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: eventAdminHeaders(),
  });
}

export async function patchEventAttemptReps(
  reps: number,
): Promise<{ attempt: EventActiveAttempt }> {
  return apiFetch<{ attempt: EventActiveAttempt }>("/public/event/attempt/reps", {
    method: "PATCH",
    body: JSON.stringify({ reps }),
    headers: eventAdminHeaders(),
  });
}

export async function finalizeEventAttempt(): Promise<FinalizeEventAttemptResponse> {
  return apiFetch<FinalizeEventAttemptResponse>("/public/event/attempt/finalize", {
    method: "POST",
    headers: eventAdminHeaders(),
  });
}

export async function cancelEventAttempt(): Promise<{ cancelled: boolean }> {
  return apiFetch<{ cancelled: boolean }>("/public/event/attempt/cancel", {
    method: "POST",
    headers: eventAdminHeaders(),
  });
}

export async function softDeleteAllEventEntries(): Promise<{
  deletedEntries: number;
  clearedAttempt: boolean;
}> {
  return apiFetch<{ deletedEntries: number; clearedAttempt: boolean }>(
    "/public/event/entries/reset",
    { method: "POST", headers: eventAdminHeaders() },
  );
}
