import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { PresenceBadge } from "@/components/friends/PresenceBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useFriendsPresence } from "@/hooks/use-friends-presence";
import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { hapticImpact } from "@/lib/haptics";
import { getOrCreateConversation } from "@/lib/messaging-api";
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
import { getLocalDateKey } from "@/lib/local-date";
import { MessageCircle, UserPlus, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

function AcceptedFriendRow({
    item,
    presence,
}: {
    item: FriendListItem;
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
    const navigate = useNavigate();

    const openConversation = () => {
        void (async () => {
            try {
                const conversation = await getOrCreateConversation(item.userId);
                navigate(`/friends/chat/${conversation.id}`);
            } catch {
                toast.error(UI.friendActionError);
            }
        })();
    };

    return (
        <Card
            className="cursor-pointer py-0"
            onClick={() => {
                void hapticImpact();
                openConversation();
            }}
        >
            <CardContent className="flex items-center gap-3 p-3">
                <Link
                    to={`/friends/${item.userId}`}
                    className="flex shrink-0 items-center gap-3"
                    onClick={(event) => {
                        event.stopPropagation();
                        void hapticImpact();
                    }}
                >
                    <div className="relative shrink-0">
                        {item.avatarUrl ? (
                            <img
                                src={item.avatarUrl}
                                alt=""
                                className="size-10 rounded-full object-cover"
                            />
                        ) : (
                            <ProfileAvatarFallback
                                initials={initials}
                                className="size-10 rounded-full text-sm"
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium">{name}</p>
                        {showUsername ? (
                            <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
                        ) : null}
                    </div>
                </Link>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    {presence?.status === "training" ? (
                        <Link
                            to={`/session/${item.userId}/${getLocalDateKey()}`}
                            onClick={(event) => event.stopPropagation()}
                            className="shrink-0"
                        >
                            <PresenceBadge presence={presence} />
                        </Link>
                    ) : (
                        <PresenceBadge presence={presence} />
                    )}
                    <MessageCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </div>
            </CardContent>
        </Card>
    );
}

function PendingFriendRow({
    item,
    onAccept,
    onDecline,
    onCancel,
}: {
    item: FriendListItem;
    onAccept?: () => void;
    onDecline?: () => void;
    onCancel?: () => void;
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
                <Link
                    to={`/friends/preview/${item.userId}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                    onClick={() => {
                        void hapticImpact();
                    }}
                >
                    <div className="relative shrink-0">
                        {item.avatarUrl ? (
                            <img
                                src={item.avatarUrl}
                                alt=""
                                className="size-10 rounded-full object-cover"
                            />
                        ) : (
                            <ProfileAvatarFallback
                                initials={initials}
                                className="size-10 rounded-full text-sm"
                            />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        {isPendingIncoming ? (
                            <p className="text-xs text-muted-foreground">{UI.friendRequestPending}</p>
                        ) : isPendingOutgoing ? (
                            <p className="text-xs text-muted-foreground">{UI.friendRequestOutgoing}</p>
                        ) : showUsername ? (
                            <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
                        ) : null}
                    </div>
                </Link>
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
    const { byUserId } = useFriendsPresence();
    const { openReferralDrawer } = useReferralDrawer();

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
            {(data?.pendingIncoming.length ?? 0) > 0 ? (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">{UI.friendRequestsTitle}</h2>
                    {data!.pendingIncoming.map((item) => (
                        <PendingFriendRow
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
                        <PendingFriendRow
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
                    <EmptyState
                        title={UI.friendsEmpty}
                        icon={UserPlus}
                    >
                        <Button
                            className="w-full"
                            onClick={() => openReferralDrawer("invite")}
                        >
                            <Users className="mr-2 size-4" />
                            {UI.profileInviteButton}
                        </Button>
                    </EmptyState>
                ) : (
                    data!.friends.map((item) => (
                        <AcceptedFriendRow
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
