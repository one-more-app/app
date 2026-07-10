import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { BackHeader } from "@/components/BackHeader";
import { ProfileNameDisplay } from "@/components/profile/ProfileNameDisplay";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/lib/messaging-api";
import {
    getProfileDisplayName,
    getProfileInitials,
} from "@/lib/profile-display";
import {
    acceptFriendRequest,
    declineFriendRequest,
    fetchUserPreview,
    requestFriend,
} from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { MessageCircle, UserPlus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

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
                await requestFriend(userId);
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
                    <p className="text-sm text-muted-foreground">{UI.loading}</p>
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

    const initials = getProfileInitials(
        {
            firstName: data.firstName ?? undefined,
            lastName: data.lastName ?? undefined,
            username: data.username ?? undefined,
        },
        null,
    );

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader title={name} />
            <main className="mx-auto max-w-2xl space-y-6 p-4">
                <div className="flex flex-col items-center gap-3 text-center">
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
                        profile={{
                            firstName: data.firstName ?? undefined,
                            lastName: data.lastName ?? undefined,
                            username: data.username ?? undefined,
                        }}
                        align="center"
                    />
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                            {UI.profileLevelLabel} {data.level}
                        </span>
                        <span>
                            {UI.profileStreakLabel}: {data.streakCurrent}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    {data.friendshipStatus === "accepted" ? (
                        <>
                            <Button asChild className="w-full">
                                <Link to={`/friends/${data.userId}`}>{UI.friendViewProfile}</Link>
                            </Button>
                            <Button variant="secondary" className="w-full" onClick={handleMessage}>
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
                                        await acceptFriendRequest(data.friendshipId!);
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
