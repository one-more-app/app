import { apiFetch } from "@/lib/api";
import type { AppsFlyerAttribution } from "@/lib/appsflyer-attribution";

export async function upsertUserAppsFlyerAttribution(
  attribution: AppsFlyerAttribution,
): Promise<void> {
  await apiFetch("/profile/attribution", {
    method: "PUT",
    body: JSON.stringify(attribution),
  });
}

