import { submitReviewFeedback, type ReviewFeedbackPayload } from "@/lib/review-feedback-api";

const QUEUE_KEY = "one-more-review-feedback-queue-v1";

type QueuedItem = ReviewFeedbackPayload & { queuedAtMs: number };

function readQueue(): QueuedItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedItem[]): void {
  if (items.length === 0) {
    localStorage.removeItem(QUEUE_KEY);
    return;
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueReviewFeedback(payload: ReviewFeedbackPayload): void {
  const queue = readQueue();
  queue.push({ ...payload, queuedAtMs: Date.now() });
  writeQueue(queue);
}

export async function flushReviewFeedbackQueue(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  const queue = readQueue();
  if (queue.length === 0) return 0;

  let sent = 0;
  const remaining: QueuedItem[] = [];
  for (const item of queue) {
    const { queuedAtMs, ...payload } = item;
    void queuedAtMs;
    try {
      await submitReviewFeedback(payload);
      sent += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return sent;
}

export function installReviewFeedbackQueueFlush(): () => void {
  if (typeof window === "undefined") return () => {};
  const onOnline = () => {
    void flushReviewFeedbackQueue();
  };
  window.addEventListener("online", onOnline);
  void flushReviewFeedbackQueue();
  return () => window.removeEventListener("online", onOnline);
}
