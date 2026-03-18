import { apiFetch } from "@/lib/api";
import type { AuthSession } from "@/lib/auth";
import type { PerformanceEntry, TrackedExercise, UserProfile } from "@/types";
import {
  getLastSyncAt,
  getPerformanceEntriesForSync,
  getTrackedExercisesForSync,
  getUserProfile,
  setLastSyncAt,
  setPerformanceEntries,
  setTrackedExercises,
  setUserProfile,
} from "@/lib/storage";

type SyncPullResponse = {
  serverTime: string;
  profile:
    | (UserProfile & {
        updatedAt: string;
      })
    | null;
  trackedExercises: Array<
    Omit<TrackedExercise, "updatedAt" | "deletedAt"> & {
      updatedAt: string;
      deletedAt: string | null;
    }
  >;
  performanceEntries: Array<
    Omit<PerformanceEntry, "updatedAt" | "deletedAt" | "createdAt"> & {
      updatedAt: string;
      deletedAt: string | null;
    }
  >;
};

function latestTs(updatedAt?: string, deletedAt?: string | null): number {
  const u = updatedAt ? new Date(updatedAt).getTime() : 0;
  const d = deletedAt ? new Date(deletedAt).getTime() : 0;
  return Math.max(u, d);
}

export async function syncNow(session: AuthSession): Promise<void> {
  const tracked = getTrackedExercisesForSync();
  const perfs = getPerformanceEntriesForSync();
  const profile = getUserProfile();

  const lastSyncAt = getLastSyncAt();

  // push
  await apiFetch<{ ok: true }>("/sync/push", {
    method: "POST",
    authToken: session.accessToken,
    body: JSON.stringify({
      profile: { ...profile, updatedAt: new Date().toISOString() },
      trackedExercises: tracked.map((e) => ({
        ...e,
        updatedAt: e.updatedAt ?? new Date().toISOString(),
        deletedAt: e.deletedAt ?? null,
      })),
      performanceEntries: perfs.map((p) => ({
        ...p,
        updatedAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
        deletedAt: p.deletedAt ?? null,
      })),
    }),
  });

  // pull
  const pull = await apiFetch<SyncPullResponse>(
    `/sync/pull${lastSyncAt ? `?since=${encodeURIComponent(lastSyncAt)}` : ""}`,
    { method: "GET", authToken: session.accessToken },
  );

  // merge tracked exercises
  const localTrackedById = new Map(tracked.map((t) => [t.id, t]));
  for (const remote of pull.trackedExercises) {
    const local = localTrackedById.get(remote.id);
    const remoteLatest = latestTs(remote.updatedAt, remote.deletedAt);
    const localLatest = local ? latestTs(local.updatedAt, local.deletedAt ?? null) : -1;
    if (!local || remoteLatest > localLatest) {
      localTrackedById.set(remote.id, {
        ...remote,
        updatedAt: remote.updatedAt,
        deletedAt: remote.deletedAt,
      });
    }
  }
  setTrackedExercises(Array.from(localTrackedById.values()));

  // merge perfs
  const localPerfById = new Map(perfs.map((p) => [p.id, p]));
  for (const remote of pull.performanceEntries) {
    const local = localPerfById.get(remote.id);
    const remoteLatest = latestTs(remote.updatedAt, remote.deletedAt);
    const localLatest = local ? latestTs(local.updatedAt, local.deletedAt ?? null) : -1;
    if (!local || remoteLatest > localLatest) {
      localPerfById.set(remote.id, {
        ...remote,
        createdAt: local?.createdAt ?? remote.updatedAt,
        updatedAt: remote.updatedAt,
        deletedAt: remote.deletedAt,
      });
    }
  }
  setPerformanceEntries(Array.from(localPerfById.values()));

  // merge profile (LWW)
  if (pull.profile) {
    // côté app on n'a pas encore updatedAt dans le profil; on applique simplement la version serveur.
    setUserProfile({
      weightKg: pull.profile.weightKg,
      heightCm: pull.profile.heightCm,
      gender: pull.profile.gender,
    });
  }

  setLastSyncAt(pull.serverTime);
}

