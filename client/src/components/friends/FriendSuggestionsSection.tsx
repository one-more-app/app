import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { ProBadge } from "@/components/profile/ProBadge";
import { UsernameLine } from "@/components/profile/UsernameLine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FRIEND_SUGGESTIONS_SWR_KEY,
  fetchFriendSuggestions,
  requestFriend,
  type FriendSuggestion,
} from "@/lib/social-api";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

function formatSuggestionReasons(item: FriendSuggestion): string {
  const parts: string[] = [];
  if (item.reasons.includes("mutual_friends")) {
    parts.push(
      item.mutualFriendsCount <= 1
        ? UI.friendSuggestionMutualOne
        : UI.friendSuggestionMutualMany.replace(
            "{count}",
            String(item.mutualFriendsCount),
          ),
    );
  }
  if (item.reasons.includes("same_gym")) {
    parts.push(UI.friendSuggestionSameGym);
  }
  return parts.join(" · ");
}

function SuggestionRow({
  item,
  onRequest,
  busy,
}: {
  item: FriendSuggestion;
  onRequest: () => void;
  busy: boolean;
}) {
  const name = getProfileDisplayName(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
      username: item.username ?? undefined,
    },
    null,
  );
  const initials = getProfileInitials(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
      username: item.username ?? undefined,
    },
    null,
  );
  const reasonLabel = formatSuggestionReasons(item);
  const showUsername =
    item.username && (item.firstName || item.lastName);

  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 p-3">
        <ProfileAvatarLink
          userId={item.userId}
          avatarUrl={item.avatarUrl}
          initials={initials}
        />
        <Link
          to={`/friends/preview/${item.userId}`}
          className="min-w-0 flex-1"
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 truncate font-medium">{name}</p>
              {item.isPremium && !showUsername ? <ProBadge /> : null}
            </div>
            {showUsername && item.username ? (
              <UsernameLine username={item.username} isPremium={item.isPremium} />
            ) : null}
            {reasonLabel ? (
              <p className="truncate text-xs text-muted-foreground">
                {reasonLabel}
              </p>
            ) : null}
          </div>
        </Link>
        <Button size="sm" onClick={onRequest} disabled={busy}>
          {UI.friendAdd}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FriendSuggestionsSection({
  onRefreshFriends,
  showSearchHint = false,
}: {
  onRefreshFriends?: () => void;
  /** When true (search page empty query), show search hint above suggestions. */
  showSearchHint?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR(
    FRIEND_SUGGESTIONS_SWR_KEY,
    fetchFriendSuggestions,
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const suggestions = data?.suggestions ?? [];

  const handleRequest = (userId: string) => {
    void (async () => {
      setBusyId(userId);
      try {
        await requestFriend(userId);
        toast.success(UI.friendRequestSent);
        await mutate(FRIEND_SUGGESTIONS_SWR_KEY);
        onRefreshFriends?.();
      } catch {
        toast.error(UI.friendActionError);
      } finally {
        setBusyId(null);
      }
    })();
  };

  if (isLoading) {
    if (!showSearchHint) return null;
    return (
      <section className="space-y-3">
        <p className="text-xs text-muted-foreground">{UI.friendsSearchEmpty}</p>
        <p className="text-sm text-muted-foreground">{UI.loading}</p>
      </section>
    );
  }

  if (suggestions.length === 0) {
    if (!showSearchHint) return null;
    return (
      <p className="text-sm text-muted-foreground">{UI.friendsSearchEmpty}</p>
    );
  }

  return (
    <section className="space-y-3">
      {showSearchHint ? (
        <p className="text-xs text-muted-foreground">{UI.friendsSearchEmpty}</p>
      ) : null}
      <h2 className="text-sm font-semibold">{UI.friendSuggestionsTitle}</h2>
      <div className="space-y-2">
        {suggestions.map((item) => (
          <SuggestionRow
            key={item.userId}
            item={item}
            busy={busyId === item.userId}
            onRequest={() => handleRequest(item.userId)}
          />
        ))}
      </div>
    </section>
  );
}
