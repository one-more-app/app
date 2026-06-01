import { BackHeader } from "@/components/BackHeader";
import { Button } from "@/components/ui/button";
import { ACCESS_SWR_KEY, useAccess } from "@/hooks/use-access";
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriendsList,
  type FriendListItem,
} from "@/lib/social-api";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ChevronRight, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import useSWR, { useSWRConfig } from "swr";

function FriendRow({
  item,
  onAccept,
  onDecline,
}: {
  item: FriendListItem;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const name = getProfileDisplayName(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
    },
    null,
  );
  const initials = getProfileInitials(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
    },
    null,
  );
  const isPendingIncoming =
    item.status === "pending" && item.direction === "incoming";

  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
      {item.avatarUrl ? (
        <img
          src={item.avatarUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        {isPendingIncoming ? (
          <p className="text-xs text-muted-foreground">{UI.friendRequestPending}</p>
        ) : null}
      </div>
      {!isPendingIncoming ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
    </div>
  );

  if (isPendingIncoming) {
    return (
      <div className="space-y-2">
        {content}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onAccept}>
            {UI.friendAccept}
          </Button>
          <Button size="sm" variant="secondary" className="flex-1" onClick={onDecline}>
            {UI.friendDecline}
          </Button>
        </div>
      </div>
    );
  }

  if (item.status === "accepted") {
    return (
      <Link to={`/friends/${item.userId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function FriendsPage() {
  const { mutate } = useSWRConfig();
  const { access, refresh: refreshAccess } = useAccess();
  const { data, isLoading, mutate: refreshFriends } = useSWR(
    "friends-list",
    fetchFriendsList,
  );

  const refreshAll = async () => {
    await Promise.all([refreshFriends(), refreshAccess(), mutate(ACCESS_SWR_KEY)]);
  };

  const handleAccept = (friendshipId: string) => {
    void (async () => {
      try {
        await acceptFriendRequest(friendshipId);
        toast.success(UI.friendAccepted);
        await refreshAll();
      } catch {
        toast.error(UI.friendActionError);
      }
    })();
  };

  const handleDecline = (friendshipId: string) => {
    void (async () => {
      try {
        await declineFriendRequest(friendshipId);
        await refreshFriends();
      } catch {
        toast.error(UI.friendActionError);
      }
    })();
  };

  return (
    <div className="min-h-screen-app bg-background">
      <BackHeader title={UI.friendsTitle} />
      <main className="mx-auto max-w-2xl space-y-6 p-4">
        {access?.accessTier === "limited" ? (
          <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {UI.accessUnlockHint}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{UI.loading}</p>
        ) : (
          <>
            {(data?.pendingIncoming.length ?? 0) > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">{UI.friendRequestsTitle}</h2>
                {data!.pendingIncoming.map((item) => (
                  <FriendRow
                    key={item.friendshipId}
                    item={item}
                    onAccept={() => handleAccept(item.friendshipId)}
                    onDecline={() => handleDecline(item.friendshipId)}
                  />
                ))}
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-sm font-semibold">{UI.friendsListTitle}</h2>
              {(data?.friends.length ?? 0) === 0 ? (
                <div
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 p-8 text-center",
                  )}
                >
                  <UserPlus className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{UI.friendsEmpty}</p>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/profile">{UI.profileInviteButton}</Link>
                  </Button>
                </div>
              ) : (
                data!.friends.map((item) => (
                  <FriendRow key={item.friendshipId} item={item} />
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
