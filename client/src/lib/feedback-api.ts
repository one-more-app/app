import { apiFetch } from "@/lib/api";

export type FeedbackKind = "bug" | "idea" | "suggestion";

export type FeedbackPayload = {
  kind: FeedbackKind;
  title: string;
  message: string;
  context?: {
    platform?: "web" | "ios" | "android";
    route?: string;
    appVersion?: string;
    buildNumber?: string;
  };
};

export async function submitFeedback(payload: FeedbackPayload) {
  return apiFetch<{ ok: true }>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
