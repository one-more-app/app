import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  hapticImpact,
  hapticImpactHeavy,
  hapticImpactMedium,
  hapticNotificationSuccess,
} from "@/lib/haptics";
import { playMilestoneSound } from "@/lib/milestone-sound";
import type {
  LeaguePromotionPayload,
  NewRecordCelebrationPayload,
} from "@/lib/perf-notifications";
import type {
  LevelUpCelebrationPayload,
  StreakCelebrationPayload,
} from "@/lib/xp-notifications";

export type CelebrationItem =
  | { kind: "league"; payload: LeaguePromotionPayload }
  | { kind: "record"; payload: NewRecordCelebrationPayload }
  | { kind: "levelup"; payload: LevelUpCelebrationPayload }
  | { kind: "streak"; payload: StreakCelebrationPayload };

export type CelebrationQueueSnapshot = {
  current: CelebrationItem | null;
  /** Nombre total d’éléments en file (modale courante incluse). */
  total: number;
  /** Éléments restants après la modale courante. */
  pendingCount: number;
  isActive: boolean;
};

const PRIORITY: Record<CelebrationItem["kind"], number> = {
  league: 0,
  record: 1,
  levelup: 2,
  streak: 3,
};

const queue: CelebrationItem[] = [];
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function playCelebrationFeedback(item: CelebrationItem): void {
  playMilestoneSound(item.kind);
  switch (item.kind) {
    case "league":
      void hapticImpactHeavy();
      break;
    case "record":
      void hapticNotificationSuccess();
      break;
    case "levelup":
      void hapticImpactMedium();
      break;
    case "streak":
      void hapticImpact();
      break;
  }
}

const emptySnapshot: CelebrationQueueSnapshot = {
  current: null,
  total: 0,
  pendingCount: 0,
  isActive: false,
};

/** Référence stable pour useSyncExternalStore (ne pas recréer à chaque getSnapshot). */
let cachedSnapshot: CelebrationQueueSnapshot = emptySnapshot;

function syncCachedSnapshot(): void {
  const total = queue.length;
  if (total === 0) {
    if (cachedSnapshot !== emptySnapshot) {
      cachedSnapshot = emptySnapshot;
    }
    return;
  }

  const current = queue[0] ?? null;
  const pendingCount = Math.max(0, total - 1);
  const isActive = true;

  if (
    cachedSnapshot.current === current &&
    cachedSnapshot.total === total &&
    cachedSnapshot.pendingCount === pendingCount &&
    cachedSnapshot.isActive === isActive
  ) {
    return;
  }

  cachedSnapshot = { current, total, pendingCount, isActive };
}

export function getCelebrationSnapshot(): CelebrationQueueSnapshot {
  return cachedSnapshot;
}

export function subscribeCelebrationQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function enqueueCelebration(item: CelebrationItem): void {
  const priority = PRIORITY[item.kind];
  const insertAt = queue.findIndex((q) => PRIORITY[q.kind] > priority);
  const wasEmpty = queue.length === 0;

  if (insertAt === -1) {
    queue.push(item);
  } else {
    queue.splice(insertAt, 0, item);
  }

  if (wasEmpty) {
    playCelebrationFeedback(item);
    track(AnalyticsEvents.CELEBRATION_VIEWED, {
      kind: item.kind,
      exercise_name:
        item.kind === "league" || item.kind === "record"
          ? item.payload.exerciseName
          : undefined,
    });
  }

  syncCachedSnapshot();
  notifyListeners();
}

export function advanceCelebrationQueue(): void {
  if (queue.length === 0) return;

  queue.shift();

  if (queue.length > 0) {
    playCelebrationFeedback(queue[0]!);
  }

  syncCachedSnapshot();
  notifyListeners();
}

export function clearCelebrationQueue(): void {
  queue.length = 0;
  syncCachedSnapshot();
  notifyListeners();
}

export function getCelebrationServerSnapshot(): CelebrationQueueSnapshot {
  return emptySnapshot;
}
