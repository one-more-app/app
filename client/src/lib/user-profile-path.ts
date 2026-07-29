export type UserProfileLinkOptions = {
  friendshipStatus?: "pending" | "accepted" | "declined" | "blocked" | null;
  isSelf?: boolean;
};

export function getUserProfilePath(
  userId: string,
  options?: UserProfileLinkOptions,
): string {
  if (options?.isSelf) return "/profile";
  if (options?.friendshipStatus === "accepted") {
    return `/friends/${userId}`;
  }
  return `/friends/preview/${userId}`;
}
