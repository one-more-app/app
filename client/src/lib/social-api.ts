import { apiFetch } from "@/lib/api";
import type { UserProgressState } from "@/types";

export const ACCESS_SWR_KEY = "user-access";

export type UserAccess = {
  exerciseLimit: number;
  activeExerciseCount: number;
  canAddExercise: boolean;
  referralCount: number;
  hasUsedReferralCode: boolean;
  bonusFromReferrals: number;
  bonusFromBeingReferred: number;
  isPremium: boolean;
  tshirtRewardEligible: boolean;
  referralsUntilTshirt: number;
};

export type InviteCode = {
  code: string;
};

/** @deprecated Utiliser InviteCode — conservé pour compatibilité URL */
export type InviteLink = InviteCode & {
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
  username: string | null;
  avatarUrl: string | null;
  status: "pending" | "accepted" | "declined" | "blocked";
  direction: "incoming" | "outgoing" | "friend";
};

export type FriendsListResponse = {
  friends: FriendListItem[];
  pendingIncoming: FriendListItem[];
  pendingOutgoing: FriendListItem[];
};

import type { LeagueSummaryDto } from "@/lib/league-types";
import type { PerformanceEntry, UserProfile } from "@/types";
import type { TrackedExerciseWithPerformance } from "@/lib/data-api";

export type FriendProfile = {
  userId: string;
  profile: UserProfile;
  progress: UserProgressState;
  exercises: TrackedExerciseWithPerformance[];
  performanceEntries: PerformanceEntry[];
  leagueSummary: LeagueSummaryDto | null;
};

export async function fetchUserAccess(): Promise<UserAccess> {
  return await apiFetch<UserAccess>("/me/access");
}

export async function fetchInviteCode(): Promise<InviteCode> {
  return await apiFetch<InviteCode>("/social/invite-code");
}

export async function fetchInviteLink(): Promise<InviteLink> {
  return await apiFetch<InviteLink>("/social/invite-link");
}

export async function fetchInvitePreview(code: string): Promise<InvitePreview> {
  return await apiFetch<InvitePreview>(
    `/social/invite/${encodeURIComponent(code)}/preview`,
  );
}

export async function applyReferralCode(
  inviteCode: string,
): Promise<{ ok: true; referrerUserId: string }> {
  return await apiFetch("/social/referral/apply", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
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

export type UserSearchResult = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  friendshipStatus: FriendListItem["status"] | null;
  friendshipId: string | null;
  friendshipDirection: "incoming" | "outgoing" | null;
};

export type UserPreview = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  level: number;
  streakCurrent: number;
  friendshipStatus: FriendListItem["status"] | null;
  friendshipId: string | null;
  friendshipDirection: "incoming" | "outgoing" | null;
};

export function isFriendSearchReady(q: string): boolean {
  const trimmed = q.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("@")) {
    return trimmed.replace(/^@+/, "").length >= 1;
  }
  return trimmed.length >= 2;
}

export async function searchUsers(q: string): Promise<{ results: UserSearchResult[] }> {
  const params = new URLSearchParams({ q });
  return await apiFetch(`/social/users/search?${params.toString()}`);
}

export async function fetchUserPreview(userId: string): Promise<UserPreview> {
  return await apiFetch<UserPreview>(`/social/users/${userId}/preview`);
}

export async function requestFriend(userId: string): Promise<{
  friendshipId: string;
  status: string;
}> {
  return await apiFetch("/social/friends/request", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function cancelFriendRequest(
  friendshipId: string,
): Promise<{ ok: boolean }> {
  return await apiFetch(`/social/friends/requests/${friendshipId}`, {
    method: "DELETE",
  });
}

