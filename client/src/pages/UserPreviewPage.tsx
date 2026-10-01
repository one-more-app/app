import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { BackHeader } from "@/components/BackHeader";
import { ProfileNameDisplay } from "@/components/profile/ProfileNameDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrCreateConversation } from "@/lib/messaging-api";
import {
    getProfileDisplayName,
    getProfileInitials,
} from "@/lib/profile-display";
import { profileNestedClass } from "@/lib/profile-section";
import {
    acceptFriendRequest,
    declineFriendRequest,
    fetchUserPreview,
    requestFriend,
} from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { CalendarDays, Flame, MessageCircle, UserPlus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

function mutualFriendsLabel(count: number): string {
    return count <= 1
        ? UI.friendSuggestionMutualOne
        : UI.friendSuggestionMutualMany.replace("{count}", String(count));
}

function UserPreviewSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label={UI.loading}>
            <Card>
                <CardContent className="flex flex-col items-center gap-3 pt-0">
                    <Skeleton className="size-20 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-[4.5rem] rounded-lg" />
                        <Skeleton className="h-[4.5rem] rounded-lg" />
                        <Skeleton className="h-[4.5rem] rounded-lg" />
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    );
}

export default function UserPreviewPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { data, isLoading, error, mutate } = useSWR(
        userId ? ["user-preview", userId] : null,
        () => fetchUserPreview(userId!),
    );

    const name = data
        ? getProfileDisplayName(
            {
                firstName: data.firstName ?? undefined,
                lastName: data.lastName ?? undefined,
                username: data.username ?? undefined,
            },
            null,
        )
        : UI.profile;

    const handleRequest = () => {
        if (!userId) return;
        void (async () => {
            try {
                await requestFriend(userId, { source: "user_preview" });
                toast.success(UI.friendRequestSent);
                await mutate();
            } catch {
                toast.error(UI.friendActionError);
            }
        })();
    };

    const handleMessage = () => {
        if (!userId) return;
        void (async () => {
            try {
                const conv = await getOrCreateConversation(userId);
                navigate(`/friends/chat/${conv.id}`);
            } catch {
                toast.error(UI.friendActionError);
            }
        })();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen-app bg-background">
                <BackHeader title={UI.profile} />
                <main className="mx-auto max-w-2xl p-4">
                    <UserPreviewSkeleton />
                </main>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen-app bg-background">
                <BackHeader title={UI.profile} />
                <main className="mx-auto max-w-2xl p-4">
                    <p className="text-sm text-destructive">{UI.friendProfileUnavailable}</p>
                </main>
            </div>
        );
    }

    const profile = {
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        username: data.username ?? undefined,
    };
    const initials = getProfileInitials(profile, null);

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader title={name} />
            <main className="mx-auto max-w-2xl space-y-4 p-4">
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 pt-0 text-center">
                        {data.avatarUrl ? (
                            <img
                                src={data.avatarUrl}
                                alt=""
                                className="size-20 rounded-full object-cover"
                            />
                        ) : (
                            <ProfileAvatarFallback
                                initials={initials}
                                className="size-20 rounded-full text-2xl"
                            />
                        )}
                        <ProfileNameDisplay
                            profile={profile}
                            isPremium={data.isPremium}
                            align="center"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-3">
                            <div className={`${profileNestedClass} p-3`}>
                                <p className="text-xs text-muted-foreground">
                                    {UI.profileLevelLabel}
                                </p>
                                <p className="mt-1 text-lg font-bold tabular-nums">
                                    {data.level}
                                </p>
                            </div>
                            <div className={`${profileNestedClass} p-3`}>
                                <p className="text-xs text-muted-foreground">
                                    {UI.profileStreakLabel}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
                                    {data.streakCurrent > 0 ? (
                                        <Flame
                                            className="size-4 text-orange-500"
                                            aria-hidden
                                        />
                                    ) : null}
                                    {data.streakCurrent}
                                </p>
                            </div>
                            <div className={`${profileNestedClass} p-3`}>
                                <p className="text-xs text-muted-foreground">
                                    {UI.profileActiveDaysThisMonth}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
                                    <CalendarDays
                                        className="size-4 shrink-0 text-muted-foreground"
                                        aria-hidden
                                    />
                                    {data.activeDaysThisMonth}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {data.mutualFriendsCount > 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                        {mutualFriendsLabel(data.mutualFriendsCount)}
                    </p>
                ) : null}

                <div className="flex flex-col gap-2">
                    {data.friendshipStatus === "accepted" ? (
                        <>
                            <Button asChild className="w-full">
                                <Link to={`/friends/${data.userId}`}>
                                    {UI.friendViewProfile}
                                </Link>
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handleMessage}
                            >
                                <MessageCircle className="size-4" />
                                {UI.messageOpenChat}
                            </Button>
                        </>
                    ) : data.friendshipStatus === "pending" &&
                        data.friendshipDirection === "incoming" ? (
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => {
                                    if (!data.friendshipId) return;
                                    void (async () => {
                                        await acceptFriendRequest(data.friendshipId!, {
                                            source: "user_preview",
                                            requesterUserId: data.userId,
                                        });
                                        toast.success(UI.friendAccepted);
                                        await mutate();
                                    })();
                                }}
                            >
                                {UI.friendAccept}
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    if (!data.friendshipId) return;
                                    void (async () => {
                                        await declineFriendRequest(data.friendshipId!);
                                        await mutate();
                                    })();
                                }}
                            >
                                {UI.friendDecline}
                            </Button>
                        </div>
                    ) : data.friendshipStatus === "pending" ? (
                        <p className="text-center text-sm text-muted-foreground">
                            {UI.friendRequestOutgoing}
                        </p>
                    ) : (
                        <Button className="w-full" onClick={handleRequest}>
                            <UserPlus className="size-4" />
                            {UI.friendAdd}
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
}
