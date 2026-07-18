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

/**
 * Opt-in debug only — leave unset/false in normal builds.
 * VITE_DEBUG_DISABLE_CELEBRATIONS=true coupe les modales.
 */
export const DEBUG_DISABLE_CELEBRATIONS =
  import.meta.env.VITE_DEBUG_DISABLE_CELEBRATIONS === "true";

const PRIORITY: Record<CelebrationItem["kind"], number> = {
  league: 0,
  record: 1,
  levelup: 2,
  streak: 3,
};

const queue: CelebrationItem[] = [];
const listeners = new Set<() => void>();
const idleWaiters: Array<() => void> = [];
let listenersNotifyScheduled = false;
/** Bloque le Joyride / overlays pendant navigate→settle→célébration (évite le flash). */
let uiHold = false;

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Coalesce several enqueues in the same turn (streak + league) into one React update. */
function scheduleNotifyListeners(): void {
  if (listenersNotifyScheduled) return;
  listenersNotifyScheduled = true;
  queueMicrotask(() => {
    listenersNotifyScheduled = false;
    syncCachedSnapshot();
    notifyListeners();
  });
}

/**
 * Son + haptics pour la modale *affichée*.
 * À appeler après paint (pas au moment de l’enqueue) pour éviter le jank iOS.
 */
export function playCelebrationFeedback(item: CelebrationItem): void {
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

export function trackCelebrationViewed(item: CelebrationItem): void {
  track(AnalyticsEvents.CELEBRATION_VIEWED, {
    kind: item.kind,
    exercise_name:
      item.kind === "league" || item.kind === "record"
        ? item.payload.exerciseName
        : undefined,
  });
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
  const current = queue[0] ?? null;
  const pendingCount = Math.max(0, total - 1);
  const isActive = total > 0 || uiHold;

  if (!isActive) {
    if (cachedSnapshot !== emptySnapshot) {
      cachedSnapshot = emptySnapshot;
    }
    return;
  }

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

/**
 * Hold UI (ex. tour détail) avant navigate + pendant le settle,
 * jusqu’à ce que les célébrations soient enqueued puis dismissées.
 */
export function setCelebrationUiHold(held: boolean): void {
  if (uiHold === held) return;
  uiHold = held;
  syncCachedSnapshot();
  notifyListeners();
}

/** true si modale active OU hold first-perf (navigate→paint→célébration). */
export function isCelebrationUiBusy(): boolean {
  return queue.length > 0 || uiHold;
}

/**
 * Attend que file + hold soient libres (ex. RestTimer après first-perf).
 */
export function whenCelebrationUiIdle(callback: () => void): void {
  if (!isCelebrationUiBusy()) {
    callback();
    return;
  }
  const unsub = subscribeCelebrationQueue(() => {
    if (isCelebrationUiBusy()) return;
    unsub();
    callback();
  });
}

function flushIdleWaitersIfIdle(): void {
  // Seulement la file de modales — pas uiHold (sinon deadlock avec release hold).
  if (queue.length > 0 || idleWaiters.length === 0) return;
  const waiters = idleWaiters.splice(0, idleWaiters.length);
  for (const waiter of waiters) {
    try {
      waiter();
    } catch {
      /* ignore */
    }
  }
}

export function getCelebrationSnapshot(): CelebrationQueueSnapshot {
  return cachedSnapshot;
}

export function subscribeCelebrationQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Exécute `callback` quand la file de célébrations est vide.
 * Attend 2 frames pour laisser peindre une modale venant d’être enqueued ;
 * si une modale est active, attend le dismiss (Continue).
 */
export function whenCelebrationQueueIdle(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (queue.length === 0) {
        callback();
        return;
      }
      idleWaiters.push(callback);
    });
  });
}

/**
 * Attend que le thread UI digère un unmount d’overlay (drawer / Joyride)
 * avant d’ouvrir une Dialog de célébration — critique sur first-install iOS.
 */
export function afterUiOverlaySettle(ms = 320): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, ms);
      });
    });
  });
}

/**
 * First-perf : attendre que la page exo soit peinte (GIF inclus) AVANT
 * d’ouvrir la modale — sinon décode GIF + Dialog + RestTimer = freeze Continuer.
 */
export async function waitForExercisePagePainted(
  timeoutMs = 3000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const overview = document.querySelector(
      '[data-tour="exercise-overview"]',
    );
    if (overview) {
      const imgs = [...overview.querySelectorAll("img")];
      const imagesReady =
        imgs.length === 0 || imgs.every((img) => img.complete);
      if (imagesReady) {
        await afterUiOverlaySettle(100);
        return;
      }
    }
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 40);
    });
  }
}

export function enqueueCelebration(item: CelebrationItem): void {
  if (DEBUG_DISABLE_CELEBRATIONS) {
    if (typeof console !== "undefined") {
      console.log("[first-perf-debug] celebration skipped (disabled)", {
        kind: item.kind,
        t: Date.now(),
      });
    }
    return;
  }

  const priority = PRIORITY[item.kind];
  const insertAt = queue.findIndex((q) => PRIORITY[q.kind] > priority);

  if (insertAt === -1) {
    queue.push(item);
  } else {
    queue.splice(insertAt, 0, item);
  }

  if (typeof console !== "undefined") {
    console.log("[first-perf-debug] celebration enqueued", {
      kind: item.kind,
      head: queue[0]?.kind,
      total: queue.length,
      t: Date.now(),
    });
  }

  // Snapshot sync for any sync readers; React notified once per turn.
  syncCachedSnapshot();
  scheduleNotifyListeners();
}

export function advanceCelebrationQueue(): void {
  if (queue.length === 0) return;

  queue.shift();

  syncCachedSnapshot();
  notifyListeners();

  if (queue.length === 0) {
    if (typeof console !== "undefined") {
      console.log("[first-perf-debug] celebration queue idle", { t: Date.now() });
    }
    flushIdleWaitersIfIdle();
  }
  // Feedback for the next item is played by the host after paint.
}

export function clearCelebrationQueue(): void {
  queue.length = 0;
  uiHold = false;
  syncCachedSnapshot();
  notifyListeners();
  flushIdleWaitersIfIdle();
}

export function getCelebrationServerSnapshot(): CelebrationQueueSnapshot {
  return emptySnapshot;
}
