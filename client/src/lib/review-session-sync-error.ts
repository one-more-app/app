import { getLocalDateKey } from "@/lib/local-date";

let syncErrorTodayKey: string | null = null;

export function markReviewSessionSyncError(dateKey = getLocalDateKey()): void {
  syncErrorTodayKey = dateKey;
}

export function sessionHadReviewBlockingSyncError(
  todayDateKey: string,
): boolean {
  return syncErrorTodayKey === todayDateKey;
}

export function listenReviewSessionSyncErrors(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => markReviewSessionSyncError();
  window.addEventListener("one-more:remote-write-error", handler);
  return () => {
    window.removeEventListener("one-more:remote-write-error", handler);
  };
}
