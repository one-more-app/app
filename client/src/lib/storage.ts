import {
  trackPerformanceDeleted,
  trackPerformanceEdited,
  trackPerformanceLogged,
} from "@/lib/analytics";
import {
  deletePerformanceEntryRemote,
  deleteTrackedExerciseRemote,
  patchPerformanceEntry,
  patchTrackedExercise,
  upsertPerformanceEntry,
  upsertRemoteProfile,
  upsertTrackedExercise,
} from "@/lib/data-api";
import { getLocalDateKey } from "@/lib/local-date";
import { preservePerformanceLogCreatedAt } from "@/lib/activity-from-performances";
import {
  clampRestTargetMs,
  DEFAULT_REST_TARGET_MS,
} from "@/lib/format-rest-elapsed";
import { scheduleRestFinishedLocalNotificationForEntry } from "@/lib/rest-timer-local-notifications";
import {
  chronologicalPerfOrder,
  getLatestPerformanceEntry,
} from "@/lib/performance-order";
import { applyXpGrantResult } from "@/lib/progress-cache";
import type {
  PerformanceEntry,
  TrackedExercise,
  UserProfile,
  XpGrantResult,
} from "@/types";

const ONBOARDING_V1_KEY = "one-more-onboarding-v1";
const ONBOARDING_FIRST_EXERCISE_PENDING_KEY =
  "one-more-onboarding-first-exercise-pending-v1";
const ONBOARDING_TOUR_COMPLETE_KEY = "one-more-onboarding-tour-complete-v1";
const ONBOARDING_POST_AUTH_REDIRECT_KEY =
  "one-more-onboarding-post-auth-redirect-v1";
const ONBOARDING_GYM_PENDING_KEY = "one-more-onboarding-gym-pending-v1";
const GYM_ONBOARDING_IN_ZONE_KEY = "one-more-gym-onboarding-in-zone-v1";
const GYM_ONBOARDING_NAME_KEY = "one-more-gym-onboarding-name-v1";
const GYM_LOCATION_PROMPT_DONE_KEY =
  "one-more-gym-location-prompt-done-v1";
const GYM_NOTIFICATIONS_PROMPT_DONE_KEY =
  "one-more-gym-notifications-prompt-done-v1";
const GYM_SETUP_DONE_KEY = "one-more-gym-setup-done-v1";
const GYM_NOTIF_LAST_KEY = "one-more-gym-notif-last-v1";
const THEME_PREFERENCE_KEY = "one-more-theme-preference-v1";
const REST_TARGET_MS_KEY = "one-more-rest-target-ms-v1";
const REST_COUNTER_TOUR_COMPLETE_KEY = "one-more-rest-counter-tour-complete-v1";
const HOME_TOUR_COMPLETE_KEY = "one-more-home-tour-complete-v1";

type LocalChangeKind =
  | "trackedExercise"
  | "performance"
  | "profile"
  | "progress";
export type ThemePreference = "system" | "light" | "dark";

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  heightCm: 175,
  gender: "male",
};

let trackedCache: TrackedExercise[] = [];
let performanceCache: PerformanceEntry[] = [];
/** Référence stable pour useSyncExternalStore (évite une boucle de rendu). */
let activePerformanceSnapshot: PerformanceEntry[] = [];
let profileCache: UserProfile = DEFAULT_PROFILE;
let hasProfilePersistedCache = false;

function notifyLocalDataChanged(kind: LocalChangeKind): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("one-more:local-data-changed", {
      detail: { kind, at: Date.now() },
    }),
  );
}

function notifyRemoteWriteError(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("one-more:remote-write-error", {
      detail: { at: Date.now() },
    }),
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function updateTrackedCache(list: TrackedExercise[]): void {
  trackedCache = list;
}

function syncActivePerformanceSnapshot(): void {
  activePerformanceSnapshot = performanceCache.filter((e) => !e.deletedAt);
}

function updatePerformanceCache(list: PerformanceEntry[]): void {
  performanceCache = list;
  syncActivePerformanceSnapshot();
}

syncActivePerformanceSnapshot();

export function getTrackedExercises(): TrackedExercise[] {
  return trackedCache.filter((e) => !e.deletedAt);
}

/** Cache brut (y compris suppressions douces). Pour les mises à jour locales. */
export function getAllTrackedExercises(): TrackedExercise[] {
  return [...trackedCache];
}

export function setTrackedExercises(exercises: TrackedExercise[]): void {
  updateTrackedCache(exercises);
}

export function addTrackedExercise(exercise: TrackedExercise): void {
  const list = getAllTrackedExercises();
  if (
    list.some(
      (e) =>
        !e.deletedAt &&
        (e.id === exercise.id ||
          (e.exerciseId === exercise.exerciseId && !e.isCustom)),
    )
  ) {
    return;
  }
  const next: TrackedExercise = {
    ...exercise,
    updatedAt: nowIso(),
    deletedAt: null,
  };
  updateTrackedCache([...list, next]);
  notifyLocalDataChanged("trackedExercise");
  void upsertTrackedExercise(next).catch(() => notifyRemoteWriteError());
}

export async function addTrackedExerciseAndWait(
  exercise: TrackedExercise,
): Promise<TrackedExercise> {
  const list = getAllTrackedExercises();
  const existing = list.find(
    (e) =>
      !e.deletedAt &&
      (e.id === exercise.id ||
        (e.exerciseId === exercise.exerciseId && !e.isCustom)),
  );
  if (existing) return existing;

  const next: TrackedExercise = {
    ...exercise,
    updatedAt: nowIso(),
    deletedAt: null,
  };
  updateTrackedCache([...list, next]);
  notifyLocalDataChanged("trackedExercise");

  try {
    const remote = await upsertTrackedExercise(next);
    updateTrackedCache(
      getAllTrackedExercises().map((e) => (e.id === next.id ? remote : e)),
    );
    return remote;
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

export function removeTrackedExercise(id: string): void {
  const list = getAllTrackedExercises();
  const next = list.map((e) =>
    e.id === id ? { ...e, updatedAt: nowIso(), deletedAt: nowIso() } : e,
  );
  updateTrackedCache(next);
  notifyLocalDataChanged("trackedExercise");
  void deleteTrackedExerciseRemote(id).catch(() => notifyRemoteWriteError());
}

export async function removeTrackedExerciseAndWait(id: string): Promise<void> {
  const list = getAllTrackedExercises();
  const next = list.map((e) =>
    e.id === id ? { ...e, updatedAt: nowIso(), deletedAt: nowIso() } : e,
  );
  updateTrackedCache(next);
  notifyLocalDataChanged("trackedExercise");
  try {
    await deleteTrackedExerciseRemote(id);
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

function applyTrackedExerciseUpdates(
  exercise: TrackedExercise,
  updates: Partial<
    Pick<TrackedExercise, "name" | "bodyPart" | "target" | "equipment">
  >,
): TrackedExercise {
  return {
    ...exercise,
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.bodyPart !== undefined ? { bodyPart: updates.bodyPart } : {}),
    ...(updates.target !== undefined ? { target: updates.target } : {}),
    ...(updates.equipment !== undefined ? { equipment: updates.equipment } : {}),
    updatedAt: nowIso(),
  };
}

export function updateTrackedExercise(
  id: string,
  updates: Partial<
    Pick<TrackedExercise, "name" | "bodyPart" | "target" | "equipment">
  >,
): void {
  const list = getAllTrackedExercises();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return;
  list[idx] = applyTrackedExerciseUpdates(list[idx]!, updates);
  updateTrackedCache([...list]);
  notifyLocalDataChanged("trackedExercise");
  void patchTrackedExercise(id, updates).catch(() => notifyRemoteWriteError());
}

export async function updateTrackedExerciseAndWait(
  id: string,
  updates: Partial<
    Pick<TrackedExercise, "name" | "bodyPart" | "target" | "equipment">
  >,
): Promise<TrackedExercise | null> {
  const list = getAllTrackedExercises();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  list[idx] = applyTrackedExerciseUpdates(list[idx]!, updates);
  updateTrackedCache([...list]);
  notifyLocalDataChanged("trackedExercise");
  try {
    const remote = await patchTrackedExercise(id, updates);
    updateTrackedCache(
      getAllTrackedExercises().map((e) => (e.id === id ? remote : e)),
    );
    return remote;
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

export function getTrackedExerciseById(
  id: string,
): TrackedExercise | undefined {
  return trackedCache.find((e) => e.id === id && !e.deletedAt);
}

export function getPerformanceEntries(): PerformanceEntry[] {
  return activePerformanceSnapshot;
}

export function getAllPerformanceEntries(): PerformanceEntry[] {
  return [...performanceCache];
}

export function setPerformanceEntries(entries: PerformanceEntry[]): void {
  updatePerformanceCache(entries);
  notifyLocalDataChanged("performance");
}

export function getEntriesByTrackedId(
  trackedExerciseId: string,
): PerformanceEntry[] {
  return getPerformanceEntries()
    .filter((e) => e.trackedExerciseId === trackedExerciseId)
    .sort(chronologicalPerfOrder);
}

export function getAllPerformanceEntriesRecentFirst(): PerformanceEntry[] {
  return [...getPerformanceEntries()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function savePerformance(
  trackedExerciseId: string,
  weight: number,
  reps: number,
  opts?: { date?: string },
): PerformanceEntry {
  const today = getLocalDateKey();
  const day =
    opts?.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date) ? opts.date : today;
  const entry: PerformanceEntry = {
    id: crypto.randomUUID(),
    trackedExerciseId,
    date: day,
    weight,
    reps,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    deletedAt: null,
  };
  updatePerformanceCache([...getAllPerformanceEntries(), entry]);
  notifyLocalDataChanged("performance");
  trackPerformanceLogged({
    trackedExerciseId,
    entryId: entry.id,
    weight,
    reps,
    date: day,
    source: "save_performance",
  });
  void upsertPerformanceEntry(entry)
    .then(({ xp }) => {
      if (xp) applyXpGrantResult(xp);
    })
    .catch(() => notifyRemoteWriteError());
  scheduleRestFinishedLocalNotificationForEntry(entry);
  return entry;
}

export async function savePerformanceAndWait(
  trackedExerciseId: string,
  weight: number,
  reps: number,
  opts?: { date?: string },
): Promise<{ entry: PerformanceEntry; xp?: XpGrantResult }> {
  const today = getLocalDateKey();
  const day =
    opts?.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date) ? opts.date : today;
  const entry: PerformanceEntry = {
    id: crypto.randomUUID(),
    trackedExerciseId,
    date: day,
    weight,
    reps,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    deletedAt: null,
  };
  updatePerformanceCache([...getAllPerformanceEntries(), entry]);
  notifyLocalDataChanged("performance");

  try {
    const { entry: remote, xp } = await upsertPerformanceEntry(entry);
    updatePerformanceCache(
      getAllPerformanceEntries().map((e) => (e.id === entry.id ? remote : e)),
    );
    if (xp) applyXpGrantResult(xp);
    trackPerformanceLogged({
      trackedExerciseId,
      entryId: remote.id,
      weight,
      reps,
      date: day,
      source: "save_performance_and_wait",
    });
    scheduleRestFinishedLocalNotificationForEntry(remote);
    return { entry: remote, xp };
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

export function deletePerformance(entryId: string): void {
  trackPerformanceDeleted({ entryId, source: "delete_performance" });
  const next = getAllPerformanceEntries().map((e) =>
    e.id === entryId ? { ...e, updatedAt: nowIso(), deletedAt: nowIso() } : e,
  );
  updatePerformanceCache(next);
  notifyLocalDataChanged("performance");
  void deletePerformanceEntryRemote(entryId).catch(() =>
    notifyRemoteWriteError(),
  );
}

export async function deletePerformanceAndWait(entryId: string): Promise<void> {
  trackPerformanceDeleted({ entryId, source: "delete_performance_and_wait" });
  const next = getAllPerformanceEntries().map((e) =>
    e.id === entryId ? { ...e, updatedAt: nowIso(), deletedAt: nowIso() } : e,
  );
  updatePerformanceCache(next);
  notifyLocalDataChanged("performance");
  try {
    await deletePerformanceEntryRemote(entryId);
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

export function updatePerformance(
  entryId: string,
  weight: number,
  reps: number,
): PerformanceEntry | null {
  const list = getAllPerformanceEntries();
  const idx = list.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  const previous = list[idx];
  list[idx] = { ...list[idx], weight, reps, updatedAt: nowIso() };
  const updated = list[idx];
  updatePerformanceCache([...list]);
  notifyLocalDataChanged("performance");
  trackPerformanceEdited({
    entryId,
    weight,
    reps,
    previousWeight: previous.weight,
    previousReps: previous.reps,
    source: "update_performance",
  });
  void patchPerformanceEntry(entryId, { weight, reps }).catch(() =>
    notifyRemoteWriteError(),
  );
  return updated;
}

export async function updatePerformanceAndWait(
  entryId: string,
  weight: number,
  reps: number,
): Promise<PerformanceEntry | null> {
  const list = getAllPerformanceEntries();
  const idx = list.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  const previous = list[idx];
  list[idx] = { ...list[idx], weight, reps, updatedAt: nowIso() };
  updatePerformanceCache([...list]);
  notifyLocalDataChanged("performance");
  try {
    const remote = await patchPerformanceEntry(entryId, { weight, reps });
    const merged = preservePerformanceLogCreatedAt(remote, previous);
    updatePerformanceCache(
      getAllPerformanceEntries().map((e) => (e.id === entryId ? merged : e)),
    );
    trackPerformanceEdited({
      entryId,
      weight,
      reps,
      previousWeight: previous.weight,
      previousReps: previous.reps,
      source: "update_performance_and_wait",
    });
    return merged;
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

export function getLastPerformance(
  trackedExerciseId: string,
): PerformanceEntry | undefined {
  return getLatestPerformanceEntry(getEntriesByTrackedId(trackedExerciseId));
}

export function getLatestPerformanceCreatedAt(
  trackedExerciseId: string,
): number | null {
  const entries = getPerformanceEntries().filter(
    (e) => e.trackedExerciseId === trackedExerciseId,
  );
  if (entries.length === 0) return null;
  let max = 0;
  for (const e of entries) {
    const t = new Date(e.createdAt).getTime();
    if (t > max) max = t;
  }
  return max;
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

export function getUserProfile(): UserProfile {
  return profileCache;
}

export function resetUserProfileCache(): void {
  profileCache = { ...DEFAULT_PROFILE };
  hasProfilePersistedCache = false;
  notifyLocalDataChanged("profile");
}

export function hasPersistedUserProfile(): boolean {
  return hasProfilePersistedCache;
}

export function setUserProfile(
  profile: Partial<UserProfile>,
  opts?: { silent?: boolean },
): void {
  profileCache = {
    ...profileCache,
    weightKg: profile.weightKg ?? profileCache.weightKg,
    heightCm: profile.heightCm ?? profileCache.heightCm,
    gender: profile.gender ?? profileCache.gender,
    ...(profile.firstName !== undefined
      ? { firstName: profile.firstName }
      : {}),
    ...(profile.lastName !== undefined ? { lastName: profile.lastName } : {}),
    ...(profile.username !== undefined ? { username: profile.username } : {}),
    ...(profile.avatarUrl !== undefined ? { avatarUrl: profile.avatarUrl } : {}),
  };
  hasProfilePersistedCache = true;
  if (!opts?.silent) {
    notifyLocalDataChanged("profile");
    void upsertRemoteProfile(profileCache).catch(() =>
      notifyRemoteWriteError(),
    );
  }
}

export async function setUserProfileAndWait(
  profile: Partial<UserProfile>,
): Promise<UserProfile> {
  profileCache = {
    ...profileCache,
    weightKg: profile.weightKg ?? profileCache.weightKg,
    heightCm: profile.heightCm ?? profileCache.heightCm,
    gender: profile.gender ?? profileCache.gender,
    ...(profile.firstName !== undefined
      ? { firstName: profile.firstName }
      : {}),
    ...(profile.lastName !== undefined ? { lastName: profile.lastName } : {}),
    ...(profile.username !== undefined ? { username: profile.username } : {}),
    ...(profile.avatarUrl !== undefined ? { avatarUrl: profile.avatarUrl } : {}),
  };
  hasProfilePersistedCache = true;
  notifyLocalDataChanged("profile");
  try {
    const remote = await upsertRemoteProfile(profileCache);
    profileCache = {
      weightKg: remote.weightKg,
      heightCm: remote.heightCm,
      gender: remote.gender,
      ...(remote.firstName !== undefined
        ? { firstName: remote.firstName }
        : {}),
      ...(remote.lastName !== undefined ? { lastName: remote.lastName } : {}),
      ...(remote.username !== undefined ? { username: remote.username } : {}),
      ...(remote.avatarUrl !== undefined ? { avatarUrl: remote.avatarUrl } : {}),
    };
    return profileCache;
  } catch (error) {
    notifyRemoteWriteError();
    throw error;
  }
}

export function setOnboardingFirstExercisePending(pending: boolean): void {
  if (pending) {
    localStorage.setItem(ONBOARDING_FIRST_EXERCISE_PENDING_KEY, "1");
  } else {
    localStorage.removeItem(ONBOARDING_FIRST_EXERCISE_PENDING_KEY);
  }
}

export function isOnboardingFirstExercisePending(): boolean {
  return localStorage.getItem(ONBOARDING_FIRST_EXERCISE_PENDING_KEY) === "1";
}

export function setOnboardingTourComplete(complete: boolean): void {
  if (complete) {
    localStorage.setItem(ONBOARDING_TOUR_COMPLETE_KEY, "1");
  } else {
    localStorage.removeItem(ONBOARDING_TOUR_COMPLETE_KEY);
  }
}

export function isOnboardingTourComplete(): boolean {
  return localStorage.getItem(ONBOARDING_TOUR_COMPLETE_KEY) === "1";
}

export function setOnboardingPostAuthRedirect(path: string | null): void {
  if (!path) {
    localStorage.removeItem(ONBOARDING_POST_AUTH_REDIRECT_KEY);
    return;
  }
  localStorage.setItem(ONBOARDING_POST_AUTH_REDIRECT_KEY, path);
}

export function getOnboardingPostAuthRedirect(): string | null {
  const raw = localStorage.getItem(ONBOARDING_POST_AUTH_REDIRECT_KEY);
  if (!raw || !raw.startsWith("/")) return null;
  return raw;
}

export function needsOnboarding(): boolean {
  if (localStorage.getItem(ONBOARDING_V1_KEY) === "done") return false;
  if (localStorage.getItem(ONBOARDING_FIRST_EXERCISE_PENDING_KEY) === "1") {
    return true;
  }
  return localStorage.getItem(ONBOARDING_V1_KEY) !== "done";
}

export function isOnboardingGymPending(): boolean {
  return localStorage.getItem(ONBOARDING_GYM_PENDING_KEY) === "1";
}

export function setOnboardingGymPending(pending: boolean): void {
  if (pending) {
    localStorage.setItem(ONBOARDING_GYM_PENDING_KEY, "1");
  } else {
    localStorage.removeItem(ONBOARDING_GYM_PENDING_KEY);
  }
}

export function clearOnboardingGymPending(): void {
  localStorage.removeItem(ONBOARDING_GYM_PENDING_KEY);
}

/** Purge l'état salle local (changement de compte). La vérité métier est côté API. */
export function clearGymOnboardingLocalState(): void {
  clearOnboardingGymPending();
  clearGymOnboardingContext();
  localStorage.removeItem(GYM_SETUP_DONE_KEY);
}

export function setGymOnboardingContext(
  inZone: boolean,
  gymName: string,
): void {
  localStorage.setItem(GYM_ONBOARDING_IN_ZONE_KEY, inZone ? "1" : "0");
  localStorage.setItem(GYM_ONBOARDING_NAME_KEY, gymName);
}

export function getGymOnboardingContext(): {
  inZone: boolean;
  gymName: string;
} | null {
  const gymName = localStorage.getItem(GYM_ONBOARDING_NAME_KEY);
  if (!gymName) return null;
  return {
    inZone: localStorage.getItem(GYM_ONBOARDING_IN_ZONE_KEY) === "1",
    gymName,
  };
}

export function clearGymOnboardingContext(): void {
  localStorage.removeItem(GYM_ONBOARDING_IN_ZONE_KEY);
  localStorage.removeItem(GYM_ONBOARDING_NAME_KEY);
}

export function isGymLocationPromptDone(): boolean {
  if (localStorage.getItem(ONBOARDING_V1_KEY) === "done") return true;
  return localStorage.getItem(GYM_LOCATION_PROMPT_DONE_KEY) === "1";
}

export function setGymLocationPromptDone(done: boolean): void {
  if (done) {
    localStorage.setItem(GYM_LOCATION_PROMPT_DONE_KEY, "1");
  } else {
    localStorage.removeItem(GYM_LOCATION_PROMPT_DONE_KEY);
  }
}

export function isGymNotificationsPromptDone(): boolean {
  if (localStorage.getItem(ONBOARDING_V1_KEY) === "done") return true;
  return localStorage.getItem(GYM_NOTIFICATIONS_PROMPT_DONE_KEY) === "1";
}

export function setGymNotificationsPromptDone(done: boolean): void {
  if (done) {
    localStorage.setItem(GYM_NOTIFICATIONS_PROMPT_DONE_KEY, "1");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("one-more:gym-notifications-prompt-done"),
      );
    }
  } else {
    localStorage.removeItem(GYM_NOTIFICATIONS_PROMPT_DONE_KEY);
  }
}

export function setGymPermissionsPromptDone(done: boolean): void {
  setGymNotificationsPromptDone(done);
  setGymLocationPromptDone(done);
}

export function needsGymPermissionsPrompt(isNative: boolean): boolean {
  if (!isGymNotificationsPromptDone()) return true;
  if (isNative && !isGymLocationPromptDone()) return true;
  return false;
}

export function isGymSetupDone(): boolean {
  return localStorage.getItem(GYM_SETUP_DONE_KEY) === "1";
}

export function setGymSetupDone(done: boolean): void {
  if (done) {
    localStorage.setItem(GYM_SETUP_DONE_KEY, "1");
  } else {
    localStorage.removeItem(GYM_SETUP_DONE_KEY);
  }
}

export function getGymNotifLastAt(): number | null {
  const raw = localStorage.getItem(GYM_NOTIF_LAST_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setGymNotifLastAt(at: number): void {
  localStorage.setItem(GYM_NOTIF_LAST_KEY, String(at));
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_V1_KEY, "done");
  localStorage.removeItem(ONBOARDING_POST_AUTH_REDIRECT_KEY);
}

export function getThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    return "system";
  } catch {
    return "system";
  }
}

export function setThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_PREFERENCE_KEY, theme);
}

export function getRestTargetMs(): number {
  try {
    const raw = localStorage.getItem(REST_TARGET_MS_KEY);
    if (raw == null) return DEFAULT_REST_TARGET_MS;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_REST_TARGET_MS;
    return clampRestTargetMs(parsed);
  } catch {
    return DEFAULT_REST_TARGET_MS;
  }
}

export function setRestTargetMs(ms: number): void {
  const clamped = clampRestTargetMs(ms);
  localStorage.setItem(REST_TARGET_MS_KEY, String(clamped));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("one-more:rest-target-changed", {
        detail: { ms: clamped },
      }),
    );
  }
}

export function isRestCounterTourComplete(): boolean {
  try {
    return localStorage.getItem(REST_COUNTER_TOUR_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRestCounterTourComplete(complete: boolean): void {
  if (complete) {
    localStorage.setItem(REST_COUNTER_TOUR_COMPLETE_KEY, "1");
  } else {
    localStorage.removeItem(REST_COUNTER_TOUR_COMPLETE_KEY);
  }
}

export function isHomeTourComplete(): boolean {
  try {
    return localStorage.getItem(HOME_TOUR_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHomeTourComplete(complete: boolean): void {
  if (complete) {
    localStorage.setItem(HOME_TOUR_COMPLETE_KEY, "1");
  } else {
    localStorage.removeItem(HOME_TOUR_COMPLETE_KEY);
  }
}
