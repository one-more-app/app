import { apiFetch } from "@/lib/api";
import type { DiscoverySource } from "@/lib/discovery-source";

export async function upsertDiscoverySource(params: {
  source: DiscoverySource;
  detail?: string | null;
}): Promise<void> {
  await apiFetch("/profile/discovery-source", {
    method: "PUT",
    body: JSON.stringify({
      source: params.source,
      ...(params.detail != null ? { detail: params.detail } : {}),
    }),
  });
}
