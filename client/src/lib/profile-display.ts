import type { AuthUser } from "@/lib/auth";
import type { UserProfile } from "@/types";
import { UI } from "@/lib/translations";

export function getProfileDisplayName(
  profile: UserProfile | undefined,
  authUser: AuthUser | null,
): string {
  const first = profile?.firstName?.trim();
  const last = profile?.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  const email = authUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local;
  }
  return UI.profileDefaultName;
}

export function getProfileInitials(
  profile: UserProfile | undefined,
  authUser: AuthUser | null,
): string {
  const first = profile?.firstName?.trim();
  const last = profile?.lastName?.trim();
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  const email = authUser?.email?.trim();
  if (email) {
    const local = email.split("@")[0] ?? "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
  }
  return "OM";
}
