import { apiFetch } from "@/lib/api";
import type { FriendPresence } from "@/types";

export async function fetchFriendsPresence(): Promise<{ items: FriendPresence[] }> {
  return await apiFetch("/presence/friends");
}
