import { apiFetch } from "@/lib/api";

export async function syncPremiumStatus(): Promise<{ isPremium: boolean }> {
  return await apiFetch<{ isPremium: boolean }>("/me/billing/sync", {
    method: "POST",
  });
}
