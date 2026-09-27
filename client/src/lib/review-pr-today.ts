import { getLocalDateKey } from "@/lib/local-date";

let prDateKey: string | null = null;

export function markReviewPrLoggedToday(dateKey = getLocalDateKey()): void {
  prDateKey = dateKey;
}

export function hadReviewPrToday(dateKey = getLocalDateKey()): boolean {
  return prDateKey === dateKey;
}
