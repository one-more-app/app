import { apiFetch } from "@/lib/api";
import type { UserProfile } from "@/types";

export type UsernameCheckResult = {
  available: boolean;
  username: string;
  reason: "empty" | "invalid" | "taken" | null;
};

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameCheckResult> {
  const params = new URLSearchParams({ username });
  return await apiFetch<UsernameCheckResult>(
    `/auth/username/check?${params.toString()}`,
  );
}

export async function checkProfileUsernameAvailability(
  username: string,
): Promise<UsernameCheckResult> {
  const params = new URLSearchParams({ username });
  return await apiFetch<UsernameCheckResult>(
    `/profile/username/check?${params.toString()}`,
  );
}

type RemoteProfile = UserProfile & { updatedAt: string };

export async function updateProfileUsername(
  username: string,
): Promise<RemoteProfile> {
  return await apiFetch<RemoteProfile>("/profile/username", {
    method: "PUT",
    body: JSON.stringify({ username }),
  });
}
