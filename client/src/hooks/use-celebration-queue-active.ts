import {
  getCelebrationServerSnapshot,
  getCelebrationSnapshot,
  subscribeCelebrationQueue,
} from "@/lib/celebration-queue";
import { useSyncExternalStore } from "react";

export function useCelebrationQueueActive(): boolean {
  const snapshot = useSyncExternalStore(
    subscribeCelebrationQueue,
    getCelebrationSnapshot,
    getCelebrationServerSnapshot,
  );
  return snapshot.isActive;
}

export function useCelebrationQueueSnapshot() {
  return useSyncExternalStore(
    subscribeCelebrationQueue,
    getCelebrationSnapshot,
    getCelebrationServerSnapshot,
  );
}
