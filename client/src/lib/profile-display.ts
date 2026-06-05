import type { AuthUser } from "@/lib/auth";
import type { UserProfile } from "@/types";
import { UI } from "@/lib/translations";

export type ProfileNameSource =
  | Pick<UserProfile, "firstName" | "lastName" | "username">
  | UserProfile
  | undefined;

export type ResolvedProfileName = {
  fullName: string | null;
  username: string | null;
  fallbackLabel: string;
};

export function resolveProfileName(
  profile: ProfileNameSource,
  authUser: AuthUser | null = null,
): ResolvedProfileName {
  const first = profile?.firstName?.trim() || null;
  const last = profile?.lastName?.trim() || null;
  const username = profile?.username?.trim() || null;

  let fullName: string | null = null;
  if (first && last) fullName = `${first} ${last}`;
  else if (first) fullName = first;
  else if (last) fullName = last;

  let fallbackLabel = UI.profileDefaultName;
  const email = authUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) fallbackLabel = local;
  }

  return { fullName, username, fallbackLabel };
}

export function getProfilePrimaryLabel(resolved: ResolvedProfileName): string {
  if (resolved.fullName) return resolved.fullName;
  if (resolved.username) return `@${resolved.username}`;
  return resolved.fallbackLabel;
}

export function getProfileUsernameLabel(
  resolved: ResolvedProfileName,
): string | null {
  if (resolved.fullName && resolved.username) {
    return `@${resolved.username}`;
  }
  return null;
}

export function getProfileDisplayName(
  profile: ProfileNameSource,
  authUser: AuthUser | null,
): string {
  return getProfilePrimaryLabel(resolveProfileName(profile, authUser));
}

export function getProfileInitials(
  profile: ProfileNameSource,
  authUser: AuthUser | null,
): string {
  const first = profile?.firstName?.trim();
  const last = profile?.lastName?.trim();
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  const username = profile?.username?.trim();
  if (username) return username.slice(0, 2).toUpperCase();
  const email = authUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0] ?? "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
  }
  return "OM";
}
