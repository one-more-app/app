import { apiFetch } from "@/lib/api";
import type { ReviewChipKey } from "@/lib/translations";

export type ReviewFeedbackPayload = {
  chips: ReviewChipKey[];
  message?: string;
  appVersion: string;
  platform: "web" | "ios" | "android";
  locale: string;
  sessionsCount: number;
  createdAt: string;
  deviceModel?: string;
  osVersion?: string;
  sessionId?: string;
};

export async function submitReviewFeedback(payload: ReviewFeedbackPayload) {
  return apiFetch<{ ok: true }>("/feedback/review", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
