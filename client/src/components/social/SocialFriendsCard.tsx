import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { Card } from "@/components/ui/card";
import { UnreadCountBadge } from "@/components/ui/unread-count-badge";
import { hapticImpact } from "@/lib/haptics";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import type { FriendListItem } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

const MAX_AVATARS = 3;

export function SocialFriendsCard({
  friends,
  trainingCount,
  unreadCount,
  isLoading,
}: {
  friends: FriendListItem[];
  trainingCount: number;
  unreadCount: number;
  isLoading: boolean;
}) {
  const total = friends.length;
  const shown = friends.slice(0, MAX_AVATARS);
  const extra = total - shown.length;

  const countLabel =
    total === 1
      ? UI.socialFriendsCountOne.replace("{count}", "1")
      : UI.socialFriendsCountMany.replace("{count}", String(total));

  return (
    <Card className="py-0 transition-colors hover:bg-muted/25">
      <Link
        to="/friends"
        aria-label={UI.socialFriendsCardAria}
        className="flex items-center gap-3 p-3"
        onClick={() => {
          void hapticImpact();
        }}
      >
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Users className="size-5" aria-hidden />
          <UnreadCountBadge
            count={unreadCount}
            size="md"
            className="absolute -right-1 -top-1"
          />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-one-more text-sm font-bold uppercase italic">
            {UI.socialFriendsCardTitle}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {isLoading
              ? UI.loading
              : total === 0
                ? UI.socialFriendsCardEmpty
                : trainingCount > 0
                  ? `${countLabel} · ${UI.socialFriendsTrainingCount.replace("{count}", String(trainingCount))}`
                  : countLabel}
          </p>
        </div>
        {shown.length > 0 ? (
          <div className="flex shrink-0 items-center -space-x-2">
            {shown.map((friend) => {
              const profile = {
                firstName: friend.firstName ?? undefined,
                lastName: friend.lastName ?? undefined,
                username: friend.username ?? undefined,
              };
              return friend.avatarUrl ? (
                <img
                  key={friend.userId}
                  src={friend.avatarUrl}
                  alt=""
                  title={getProfileDisplayName(profile, null)}
                  className="size-8 rounded-full border-2 border-card object-cover"
                />
              ) : (
                <ProfileAvatarFallback
                  key={friend.userId}
                  initials={getProfileInitials(profile, null)}
                  className="size-8 rounded-full border-2 border-card text-[11px]"
                />
              );
            })}
            {extra > 0 ? (
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-foreground text-[10px] font-semibold text-background">
                +{extra}
              </span>
            ) : null}
          </div>
        ) : null}
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>
    </Card>
  );
}
