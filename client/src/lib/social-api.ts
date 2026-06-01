import { apiFetch } from "@/lib/api";
import type { UserProgressState } from "@/types";

export const ACCESS_SWR_KEY = "user-access";

export type AccessTier = "limited" | "full";

export type UserAccess = {
  accessTier: AccessTier;
  exerciseLimit: number | null;
  activeExerciseCount: number;
  canAddExercise: boolean;
  validatedInvitesCount: number;
};

export type InviteLink = {
  code: string;
  url: string;
};

export type InvitePreview = {
  inviterUserId: string;
  firstName: string | null;
  avatarUrl: string | null;
};

export type FriendListItem = {
  friendshipId: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  status: "pending" | "accepted" | "declined" | "blocked";
  direction: "incoming" | "outgoing" | "friend";
};

export type FriendsListResponse = {
  friends: FriendListItem[];
  pendingIncoming: FriendListItem[];
  pendingOutgoing: FriendListItem[];
};

import type {
  PerformanceEntry,
  TrackedExercise,
  UserProfile,
  UserProgressState,
} from "@/types";
import type { ExerciseWithPerf } from "@/hooks/use-home-data";

export type FriendProfile = {
  userId: string;
  profile: UserProfile;
  progress: UserProgressState;
  exercises: ExerciseWithPerf[];
  performanceEntries: PerformanceEntry[];
};

export async function fetchUserAccess(): Promise<UserAccess> {
  return await apiFetch<UserAccess>("/me/access");
}

export async function fetchInviteLink(): Promise<InviteLink> {
  return await apiFetch<InviteLink>("/social/invite-link");
}

export async function fetchInvitePreview(code: string): Promise<InvitePreview> {
  return await apiFetch<InvitePreview>(
    `/social/invite/${encodeURIComponent(code)}/preview`,
  );
}

export async function requestFriendFromInvite(
  inviteCode: string,
): Promise<{ friendshipId: string; status: string }> {
  return await apiFetch("/social/friends/request-from-invite", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export async function fetchFriendsList(): Promise<FriendsListResponse> {
  return await apiFetch<FriendsListResponse>("/social/friends");
}

export async function acceptFriendRequest(
  friendshipId: string,
): Promise<{ ok: boolean }> {
  return await apiFetch(`/social/friends/${friendshipId}/accept`, {
    method: "POST",
  });
}

export async function declineFriendRequest(
  friendshipId: string,
): Promise<{ ok: boolean }> {
  return await apiFetch(`/social/friends/${friendshipId}/decline`, {
    method: "POST",
  });
}

export async function removeFriend(userId: string): Promise<{ ok: boolean }> {
  return await apiFetch(`/social/friends/${userId}`, { method: "DELETE" });
}

export async function fetchFriendProfile(userId: string): Promise<FriendProfile> {
  return await apiFetch<FriendProfile>(`/social/friends/${userId}/profile`);
}

export async function shareInviteLink(link: InviteLink): Promise<"shared" | "copied"> {
  const text = `Rejoins-moi sur One More pour suivre ta muscu ! ${link.url}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "One More", text, url: link.url });
      return "shared";
    } catch {
      // fallback copy
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link.url);
    return "copied";
  }
  throw new Error("Partage non disponible");
}
