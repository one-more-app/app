import { apiFetch } from "@/lib/api";
import type {
  ExerciseDBExercise,
  PerformanceEntry,
  TrackedExercise,
  UserProfile,
  UserActivityMonth,
  UserProgressState,
  XpGrantResult,
} from "@/types";

type RemoteProfile = UserProfile & { updatedAt: string };

type RemoteTrackedExercise = Omit<TrackedExercise, "updatedAt" | "deletedAt"> & {
  updatedAt: string;
  deletedAt: string | null;
};

type RemotePerformanceEntry = Omit<
  PerformanceEntry,
  "updatedAt" | "deletedAt" | "createdAt"
> & {
  updatedAt: string;
  deletedAt: string | null;
  createdAt: string;
};

export type TrackedExerciseWithPerformance = TrackedExercise & {
  lastPerf: PerformanceEntry | null;
  personalBest: PerformanceEntry | null;
};

type RemoteTrackedExerciseWithPerformance = RemoteTrackedExercise & {
  lastPerf: RemotePerformanceEntry | null;
  personalBest: RemotePerformanceEntry | null;
};

function mapTracked(e: RemoteTrackedExercise): TrackedExercise {
  return {
    ...e,
    updatedAt: e.updatedAt,
    deletedAt: e.deletedAt,
  };
}

function mapPerformance(e: RemotePerformanceEntry): PerformanceEntry {
  return {
    ...e,
    createdAt: e.createdAt ?? e.updatedAt,
    updatedAt: e.updatedAt,
    deletedAt: e.deletedAt,
  };
}

function mapTrackedWithPerformance(
  e: RemoteTrackedExerciseWithPerformance,
): TrackedExerciseWithPerformance {
  return {
    ...mapTracked(e),
    lastPerf: e.lastPerf ? mapPerformance(e.lastPerf) : null,
    personalBest: e.personalBest ? mapPerformance(e.personalBest) : null,
  };
}

export async function fetchTrackedExercises(opts?: {
  includeDeleted?: boolean;
}): Promise<TrackedExercise[]> {
  const query = opts?.includeDeleted ? "?includeDeleted=true" : "";
  const items = await apiFetch<RemoteTrackedExercise[]>(
    `/tracked-exercises${query}`,
    { method: "GET" },
  );
  return items.map(mapTracked);
}

export async function fetchTrackedExercisesWithPerformance(): Promise<
  TrackedExerciseWithPerformance[]
> {
  const items = await apiFetch<RemoteTrackedExerciseWithPerformance[]>(
    "/tracked-exercises?withPerformance=true",
    { method: "GET" },
  );
  return items.map(mapTrackedWithPerformance);
}

export async function upsertTrackedExercise(
  exercise: TrackedExercise,
): Promise<TrackedExercise> {
  const item = await apiFetch<RemoteTrackedExercise>("/tracked-exercises", {
    method: "POST",
    body: JSON.stringify({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      originalName: exercise.originalName,
      bodyPart: exercise.bodyPart,
      target: exercise.target,
      equipment: exercise.equipment,
      category: exercise.category,
      gifUrl: exercise.gifUrl,
      isCustom: exercise.isCustom,
    }),
  });
  return mapTracked(item);
}

export async function patchTrackedExercise(
  id: string,
  updates: Partial<Pick<TrackedExercise, "name">>,
): Promise<TrackedExercise> {
  const item = await apiFetch<RemoteTrackedExercise>(`/tracked-exercises/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return mapTracked(item);
}

export async function deleteTrackedExerciseRemote(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/tracked-exercises/${id}`, { method: "DELETE" });
}

export async function fetchPerformanceEntries(opts?: {
  trackedExerciseId?: string;
  includeDeleted?: boolean;
}): Promise<PerformanceEntry[]> {
  const params = new URLSearchParams();
  if (opts?.trackedExerciseId) {
    params.set("trackedExerciseId", opts.trackedExerciseId);
  }
  if (opts?.includeDeleted) params.set("includeDeleted", "true");
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const items = await apiFetch<RemotePerformanceEntry[]>(
    `/performance-entries${query}`,
    { method: "GET" },
  );
  return items.map(mapPerformance);
}

type RemotePerformanceCreateResponse = RemotePerformanceEntry & {
  xp?: XpGrantResult;
};

export async function upsertPerformanceEntry(
  entry: PerformanceEntry,
): Promise<{ entry: PerformanceEntry; xp?: XpGrantResult }> {
  const item = await apiFetch<RemotePerformanceCreateResponse>(
    "/performance-entries",
    {
      method: "POST",
      body: JSON.stringify({
        id: entry.id,
        trackedExerciseId: entry.trackedExerciseId,
        date: entry.date,
        weight: entry.weight,
        reps: entry.reps,
      }),
    },
  );
  const { xp, ...rest } = item;
  return { entry: mapPerformance(rest as RemotePerformanceEntry), xp };
}

export async function fetchUserProgress(): Promise<UserProgressState> {
  return await apiFetch<UserProgressState>("/progress", { method: "GET" });
}

export async function fetchUserActivityMonth(
  month: string,
): Promise<UserActivityMonth> {
  const q = new URLSearchParams({ month });
  return await apiFetch<UserActivityMonth>(
    `/progress/activity?${q.toString()}`,
    { method: "GET" },
  );
}

export async function patchPerformanceEntry(
  id: string,
  updates: Partial<Pick<PerformanceEntry, "date" | "weight" | "reps">>,
): Promise<PerformanceEntry> {
  const item = await apiFetch<RemotePerformanceEntry>(
    `/performance-entries/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  );
  return mapPerformance(item);
}

export async function deletePerformanceEntryRemote(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/performance-entries/${id}`, { method: "DELETE" });
}

export async function fetchRemoteProfile(): Promise<RemoteProfile | null> {
  return await apiFetch<RemoteProfile | null>("/profile", { method: "GET" });
}

export async function upsertRemoteProfile(
  profile: UserProfile,
): Promise<RemoteProfile> {
  return await apiFetch<RemoteProfile>("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

type ListExercisesResponse = {
  items: ExerciseDBExercise[];
  total: number;
};

export async function fetchExercisesCatalog(params?: {
  search?: string;
  target?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
}): Promise<ListExercisesResponse> {
  const query = new URLSearchParams();
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.target) query.set("target", params.target);
  if (params?.equipment) query.set("equipment", params.equipment);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  if (typeof params?.offset === "number")
    query.set("offset", String(params.offset));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return await apiFetch<ListExercisesResponse>(`/exercises${suffix}`, {
    method: "GET",
  });
}

export async function fetchExercisesMeta(): Promise<{
  targets: string[];
  equipment: string[];
}> {
  return await apiFetch<{ targets: string[]; equipment: string[] }>(
    "/exercises/meta",
    { method: "GET" },
  );
}
