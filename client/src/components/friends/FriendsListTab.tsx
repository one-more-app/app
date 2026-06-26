import { PresenceBadge } from "@/components/friends/PresenceBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFriendsPresence } from "@/hooks/use-friends-presence";
import { hapticImpact } from "@/lib/haptics";
import {
    getProfileDisplayName,
    getProfileInitials,
} from "@/lib/profile-display";
import {
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    type FriendListItem,
    type FriendsListResponse,
} from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { cn } from "@/lib/utils";
import { ChevronRight, Dumbbell, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function FriendRow({
    item,
    onAccept,
    onDecline,
    onCancel,
    presence,
}: {
    item: FriendListItem;
    onAccept?: () => void;
    onDecline?: () => void;
    onCancel?: () => void;
    presence?: ReturnType<typeof useFriendsPresence>["byUserId"] extends Map<
        string,
        infer V
    >
    ? V
    : never;
}) {
    const profile = {
        firstName: item.firstName ?? undefined,
        lastName: item.lastName ?? undefined,
        username: item.username ?? undefined,
    };
    const name = getProfileDisplayName(profile, null);
    const initials = getProfileInitials(profile, null);
    const showUsername =
        item.username && (item.firstName || item.lastName);
    const isPendingIncoming =
        item.status === "pending" && item.direction === "incoming";
    const isPendingOutgoing =
        item.status === "pending" && item.direction === "outgoing";

    const content = (
        <Card className="py-0">
            <CardContent className="flex items-center gap-3 p-3">
                <div className="relative shrink-0">
                    {item.avatarUrl ? (
                        <img
                            src={item.avatarUrl}
                            alt=""
                            className="size-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {initials}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    {isPendingIncoming ? (
                        <p className="text-xs text-muted-foreground">{UI.friendRequestPending}</p>
                    ) : isPendingOutgoing ? (
                        <p className="text-xs text-muted-foreground">{UI.friendRequestOutgoing}</p>
                    ) : (
                        <>
                            {showUsername ? (
                                <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
                            ) : null}
                            <PresenceBadge presence={presence} />
                        </>
                    )}
                </div>
                {!isPendingIncoming && !isPendingOutgoing ? (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                ) : null}
            </CardContent>
        </Card>
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

    if (isPendingOutgoing) {
        return (
            <div className="space-y-2">
                {content}
                <Button size="sm" variant="secondary" className="w-full" onClick={onCancel}>
                    {UI.friendCancelRequest}
                </Button>
            </div>
        );
    }

    if (item.status === "accepted") {
        return (
            <Link
                to={`/friends/${item.userId}`}
                className="block"
                onClick={() => {
                    void hapticImpact();
                }}
            >
                {content}
            </Link>
        );
    }

    return content;
}

export function FriendsListTab({
    data,
    isLoading,
    onRefresh,
}: {
    data?: FriendsListResponse;
    isLoading: boolean;
    onRefresh: () => Promise<void>;
}) {
    const { openReferralDrawer } = useReferralDrawer();
    const { byUserId, trainingFriends } = useFriendsPresence();

    const handleAccept = (friendshipId: string) => {
        void (async () => {
            try {
                await acceptFriendRequest(friendshipId);
                toast.success(UI.friendAccepted);
                await onRefresh();
            } catch {
                toast.error(UI.friendActionError);
            }
        })();
    };

    const handleDecline = (friendshipId: string) => {
        void (async () => {
            try {
                await declineFriendRequest(friendshipId);
                await onRefresh();
            } catch {
                toast.error(UI.friendActionError);
            }
        })();
    };

    const handleCancel = (friendshipId: string) => {
        void (async () => {
            try {
                await cancelFriendRequest(friendshipId);
                await onRefresh();
            } catch {
                toast.error(UI.friendActionError);
            }
        })();
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">{UI.loading}</p>;
    }

    return (
        <div className="space-y-6">
            {trainingFriends.length > 0 ? (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">{UI.friendsTrainingNow}</h2>
                    <div className="space-y-2">
                        {trainingFriends.map((p) => {
                            const friend = data?.friends.find((f) => f.userId === p.userId);
                            if (!friend) return null;
                            return (
                                <Link
                                    key={p.userId}
                                    to={`/friends/${p.userId}`}
                                    className="block"
                                    onClick={() => {
                                        void hapticImpact();
                                    }}
                                >
                                    <Card className="border border-amber-500/30 bg-amber-500/5 py-0">
                                        <CardContent className="flex items-center gap-3 p-3">
                                            <Dumbbell className="size-5 shrink-0 text-amber-600" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">
                                                    {getProfileDisplayName(
                                                        {
                                                            firstName: friend.firstName ?? undefined,
                                                            lastName: friend.lastName ?? undefined,
                                                            username: friend.username ?? undefined,
                                                        },
                                                        null,
                                                    )}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {p.exerciseName ?? UI.friendsTrainingGeneric}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            ) : null}

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

            {(data?.pendingOutgoing.length ?? 0) > 0 ? (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">{UI.friendRequestsOutgoingTitle}</h2>
                    {data!.pendingOutgoing.map((item) => (
                        <FriendRow
                            key={item.friendshipId}
                            item={item}
                            onCancel={() => handleCancel(item.friendshipId)}
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
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openReferralDrawer("invite")}
                        >
                            {UI.profileInviteButton}
                        </Button>
                    </div>
                ) : (
                    data!.friends.map((item) => (
                        <FriendRow
                            key={item.friendshipId}
                            item={item}
                            presence={byUserId.get(item.userId)}
                        />
                    ))
                )}
            </section>
        </div>
    );
}
