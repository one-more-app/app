import { apiFetch } from "@/lib/api";

export async function syncPremiumStatus(options?: {
  force?: boolean;
}): Promise<{ isPremium: boolean }> {
  const query = options?.force ? "?force=1" : "";
  return await apiFetch<{ isPremium: boolean }>(`/me/billing/sync${query}`, {
    method: "POST",
  });
}
