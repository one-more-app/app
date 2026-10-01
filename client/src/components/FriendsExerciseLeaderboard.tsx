import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { getProfileInitials } from "@/lib/profile-display";
import {
    fetchFriendsExerciseLeaderboard,
    friendsExerciseLeaderboardSwrKey,
    type FriendsExerciseLeaderboardEntry,
} from "@/lib/social-api";
import type { RankId } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import useSWR from "swr";

type FriendsExerciseLeaderboardProps = {
    catalogExerciseId: string | null;
    isCustom: boolean;
    refreshToken?: number | string;
    className?: string;
};

function formatSourceSet(weight: number, reps: number): string {
    const weightLabel = Number.isInteger(weight)
        ? String(weight)
        : weight.toFixed(1);
    return UI.friendsExerciseLeaderboardSourceSet
        .replace("{weight}", weightLabel)
        .replace("{reps}", String(reps));
}

function LeaderboardRow({
    entry,
    meAvatarUrl,
    meInitials,
}: {
    entry: FriendsExerciseLeaderboardEntry;
    meAvatarUrl: string | null;
    meInitials: string;
}) {
    const label = entry.isMe
        ? UI.friendsExerciseLeaderboardYou
        : entry.username
            ? `@${entry.username}`
            : UI.profileDefaultName;
    const initials = entry.isMe
        ? meInitials
        : getProfileInitials(
            {
                username: entry.username,
                firstName: null,
                lastName: null,
            },
            null,
        );
    const avatarUrl = entry.isMe
        ? (meAvatarUrl ?? entry.avatarUrl)
        : entry.avatarUrl;

    const content = (
        <div
            className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2",
                entry.isMe ? "bg-accent/25 ring-1 ring-accent/50" : undefined,
            )}
        >
            <span
                className={cn(
                    "w-6 shrink-0 text-center text-sm font-semibold tabular-nums",
                    entry.isMe ? "text-foreground" : "text-muted-foreground",
                )}
            >
                {entry.rank}
            </span>
            {entry.isMe ? (
                avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        className="size-9 shrink-0 rounded-full object-cover ring-2 ring-accent/60"
                    />
                ) : (
                    <ProfileAvatarFallback
                        initials={initials}
                        className="size-9 rounded-full text-xs ring-2 ring-accent/60"
                    />
                )
            ) : (
                <ProfileAvatarLink
                    userId={entry.userId}
                    avatarUrl={avatarUrl}
                    initials={initials}
                    sizeClassName="size-9"
                    textSizeClassName="text-xs"
                />
            )}
            <p
                className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    entry.isMe ? "font-semibold text-foreground" : "font-medium",
                )}
            >
                {label}
            </p>
            <div className="flex shrink-0 items-center gap-2">
                {entry.rankId ? (
                    <RankBadge rankId={entry.rankId as RankId} size="xs" />
                ) : null}
                <p
                    className={cn(
                        "text-sm tabular-nums",
                        entry.isMe ? "font-bold text-foreground" : "font-semibold",
                    )}
                >
                    {formatSourceSet(entry.sourceWeight, entry.sourceReps)}
                </p>
            </div>
        </div>
    );

    if (entry.isMe) return content;

    return (
        <Link
            to={`/friends/${entry.userId}`}
            className="block rounded-lg transition-colors hover:bg-muted/40"
        >
            {content}
        </Link>
    );
}

export function FriendsExerciseLeaderboard({
    catalogExerciseId,
    isCustom,
    refreshToken,
    className,
}: FriendsExerciseLeaderboardProps) {
    const auth = useAuth();
    const { data: profile } = useUserProfileData();
    const meInitials = getProfileInitials(profile, auth.user);
    const meAvatarUrl = profile?.avatarUrl ?? null;

    const canFetch =
        !isCustom &&
        !!catalogExerciseId &&
        !catalogExerciseId.startsWith("custom-");

    const { data, error, isLoading, mutate } = useSWR(
        canFetch
            ? [...friendsExerciseLeaderboardSwrKey(catalogExerciseId!), refreshToken]
            : null,
        () => fetchFriendsExerciseLeaderboard(catalogExerciseId!),
    );

    const hasComparableFriends =
        !!data && data.entries.some((entry) => !entry.isMe);

    return (
        <Card
            className={cn("gap-0", className)}
            data-tour="exercise-friends-leaderboard"
        >
            <CardHeader className="gap-0">
                <CardTitle>{UI.friendsExerciseLeaderboardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                {!canFetch ? (
                    <EmptyState
                        variant="plain"
                        icon={Users}
                        title={UI.friendsExerciseLeaderboardCatalogOnly}
                        className="py-4"
                    />
                ) : isLoading && !data ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">…</p>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <p className="text-sm text-muted-foreground">
                            {UI.friendsExerciseLeaderboardError}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void mutate()}
                        >
                            {UI.connectivityRetry}
                        </Button>
                    </div>
                ) : !hasComparableFriends ? (
                    <div className="flex flex-col gap-3">
                        {data?.entries.map((entry) => (
                            <LeaderboardRow
                                key={entry.userId}
                                entry={entry}
                                meAvatarUrl={meAvatarUrl}
                                meInitials={meInitials}
                            />
                        ))}
                        <EmptyState
                            variant="plain"
                            icon={Users}
                            title={UI.friendsExerciseLeaderboardEmpty}
                            className="py-3"
                        >
                            <Button asChild variant="secondary" size="sm">
                                <Link to="/friends">{UI.friendsExerciseLeaderboardCta}</Link>
                            </Button>
                        </EmptyState>
                    </div>
                ) : (
                    <ul className="space-y-0.5">
                        {data.entries.map((entry) => (
                            <li key={entry.userId}>
                                <LeaderboardRow
                                    entry={entry}
                                    meAvatarUrl={meAvatarUrl}
                                    meInitials={meInitials}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
