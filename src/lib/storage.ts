import type { PerformanceEntry, TrackedExercise, UserProfile } from "@/types";

const TRACKED_KEY = "one-more-tracked";
const PERFORMANCE_KEY = "one-more-performance";
const USER_PROFILE_KEY = "one-more-user-profile";
const ONBOARDING_V1_KEY = "one-more-onboarding-v1";
const SYNC_META_KEY = "one-more-sync-meta-v1";

type SyncMeta = { lastSyncAt: string | null };

function nowIso(): string {
  return new Date().toISOString();
}

function readSyncMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { lastSyncAt: null };
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return { lastSyncAt: typeof parsed.lastSyncAt === "string" ? parsed.lastSyncAt : null };
  } catch {
    return { lastSyncAt: null };
  }
}

export function getLastSyncAt(): string | null {
  return readSyncMeta().lastSyncAt;
}

export function setLastSyncAt(iso: string | null): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify({ lastSyncAt: iso } satisfies SyncMeta));
}

export function getTrackedExercises(): TrackedExercise[] {
  try {
    const raw = localStorage.getItem(TRACKED_KEY);
    const list: TrackedExercise[] = raw ? JSON.parse(raw) : [];
    const needsMigration = list.some((e) => e.originalName === undefined);
    if (needsMigration) {
      const migrated = list.map((e) => ({
        ...e,
        originalName: e.originalName ?? e.name,
        updatedAt: e.updatedAt ?? nowIso(),
        deletedAt: e.deletedAt ?? null,
      }));
      setTrackedExercises(migrated);
      return migrated.filter((e) => !e.deletedAt);
    }
    return list.filter((e) => !e.deletedAt);
  } catch {
    return [];
  }
}

export function setTrackedExercises(exercises: TrackedExercise[]): void {
  localStorage.setItem(TRACKED_KEY, JSON.stringify(exercises));
}

export function addTrackedExercise(exercise: TrackedExercise): void {
  const raw = getTrackedExercisesForSync();
  const list = raw.filter((e) => !e.deletedAt);
  if (
    list.some(
      (e) =>
        e.id === exercise.id ||
        (e.exerciseId === exercise.exerciseId && !e.isCustom),
    )
  ) {
    return;
  }
  const toStore: TrackedExercise = {
    ...exercise,
    updatedAt: nowIso(),
    deletedAt: null,
  };
  setTrackedExercises([...raw, toStore]);
}

export function removeTrackedExercise(id: string): void {
  const raw = getTrackedExercisesForSync();
  const next = raw.map((e) =>
    e.id === id ? { ...e, deletedAt: nowIso(), updatedAt: nowIso() } : e,
  );
  setTrackedExercises(next);
}

export function updateTrackedExercise(
  id: string,
  updates: Partial<Pick<TrackedExercise, "name">>,
): void {
  const list = getTrackedExercisesForSync();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const { name } = updates;
  list[idx] = {
    ...list[idx],
    ...(name !== undefined && { name }),
    updatedAt: nowIso(),
  };
  setTrackedExercises([...list]);
}

export function getTrackedExerciseById(
  id: string,
): TrackedExercise | undefined {
  return getTrackedExercises().find((e) => e.id === id);
}

export function getPerformanceEntries(): PerformanceEntry[] {
  try {
    const raw = localStorage.getItem(PERFORMANCE_KEY);
    const list: PerformanceEntry[] = raw ? JSON.parse(raw) : [];
    const migrated = list.map((e) => ({
      ...e,
      updatedAt: e.updatedAt ?? e.createdAt ?? nowIso(),
      deletedAt: e.deletedAt ?? null,
    }));
    if (JSON.stringify(migrated) !== JSON.stringify(list)) {
      setPerformanceEntries(migrated);
    }
    return migrated.filter((e) => !e.deletedAt);
  } catch {
    return [];
  }
}

export function setPerformanceEntries(entries: PerformanceEntry[]): void {
  localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(entries));
}

export function getTrackedExercisesForSync(): TrackedExercise[] {
  try {
    const raw = localStorage.getItem(TRACKED_KEY);
    const list: TrackedExercise[] = raw ? JSON.parse(raw) : [];
    return list.map((e) => ({
      ...e,
      updatedAt: e.updatedAt ?? nowIso(),
      deletedAt: e.deletedAt ?? null,
      originalName: e.originalName ?? e.name,
    }));
  } catch {
    return [];
  }
}

export function getPerformanceEntriesForSync(): PerformanceEntry[] {
  try {
    const raw = localStorage.getItem(PERFORMANCE_KEY);
    const list: PerformanceEntry[] = raw ? JSON.parse(raw) : [];
    return list.map((e) => ({
      ...e,
      updatedAt: e.updatedAt ?? e.createdAt ?? nowIso(),
      deletedAt: e.deletedAt ?? null,
    }));
  } catch {
    return [];
  }
}

export function getEntriesByTrackedId(
  trackedExerciseId: string,
): PerformanceEntry[] {
  return getPerformanceEntries()
    .filter((e) => e.trackedExerciseId === trackedExerciseId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function savePerformance(
  trackedExerciseId: string,
  weight: number,
  reps: number,
): PerformanceEntry {
  const entries = getPerformanceEntriesForSync();
  const today = new Date().toISOString().slice(0, 10);

  const newEntry: PerformanceEntry = {
    id: crypto.randomUUID(),
    trackedExerciseId,
    date: today,
    weight,
    reps,
    createdAt: new Date().toISOString(),
    updatedAt: nowIso(),
    deletedAt: null,
  };

  setPerformanceEntries([...entries, newEntry]);
  return newEntry;
}

export function deletePerformance(entryId: string): void {
  const entries = getPerformanceEntriesForSync();
  const next = entries.map((e) =>
    e.id === entryId ? { ...e, deletedAt: nowIso(), updatedAt: nowIso() } : e,
  );
  setPerformanceEntries(next);
}

export function updatePerformance(
  entryId: string,
  weight: number,
  reps: number,
): PerformanceEntry | null {
  const entries = getPerformanceEntriesForSync();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  const updated: PerformanceEntry = {
    ...entries[idx],
    weight,
    reps,
    updatedAt: nowIso(),
  };
  const newEntries = [...entries];
  newEntries[idx] = updated;
  setPerformanceEntries(newEntries);
  return updated;
}

export function getLastPerformance(
  trackedExerciseId: string,
): PerformanceEntry | undefined {
  const entries = getEntriesByTrackedId(trackedExerciseId);
  return entries[entries.length - 1];
}

export function getPersonalBest(
  trackedExerciseId: string,
): PerformanceEntry | undefined {
  const entries = getEntriesByTrackedId(trackedExerciseId);
  if (entries.length === 0) return undefined;
  return entries.reduce((best, curr) =>
    curr.weight > best.weight ||
    (curr.weight === best.weight && curr.reps > best.reps)
      ? curr
      : best,
  );
}

// --- User Profile (poids, taille pour le système de ligues) ---

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  heightCm: 175,
  gender: "male",
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      weightKg: parsed.weightKg ?? DEFAULT_PROFILE.weightKg,
      heightCm: parsed.heightCm ?? DEFAULT_PROFILE.heightCm,
      gender: parsed.gender === "female" ? "female" : "male",
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function setUserProfile(profile: Partial<UserProfile>): void {
  const current = getUserProfile();
  const updated: UserProfile = {
    weightKg: profile.weightKg ?? current.weightKg,
    heightCm: profile.heightCm ?? current.heightCm,
    gender: profile.gender ?? current.gender,
  };
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
}

export function needsOnboarding(): boolean {
  // On considère l'onboarding requis uniquement si le profil n'a jamais été enregistré.
  // `getUserProfile()` retourne des valeurs par défaut sans persister, donc ce check
  // permet un "premier lancement" fiable.
  return (
    localStorage.getItem(USER_PROFILE_KEY) === null &&
    localStorage.getItem(ONBOARDING_V1_KEY) !== "done"
  );
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_V1_KEY, "done");
}
