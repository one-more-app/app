import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { ProBadge } from "@/components/profile/ProBadge";
import { UsernameLine } from "@/components/profile/UsernameLine";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import { hapticImpact } from "@/lib/haptics";
import type { RankingEntryDto } from "@/lib/ranking-api";
import {
    getProfileDisplayName,
    getProfileInitials,
} from "@/lib/profile-display";
import type { RankId } from "@/lib/strength-standards";
import { getUserProfilePath } from "@/lib/user-profile-path";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type RankingListProps = {
    entries: RankingEntryDto[];
    meUserId: string;
    /** IDs d’amis acceptés — ouvre le profil ami plutôt que la preview. */
    friendUserIds?: ReadonlySet<string>;
};

function RankingRow({
    entry,
    isMe,
    isFriend,
}: {
    entry: RankingEntryDto;
    isMe: boolean;
    isFriend: boolean;
}) {
    const profile = {
        firstName: entry.firstName ?? undefined,
        lastName: entry.lastName ?? undefined,
        username: entry.username ?? undefined,
    };
    const displayName = getProfileDisplayName(profile, null);
    const initials = getProfileInitials(profile, null);
    const showUsername = Boolean(
        entry.username && (entry.firstName || entry.lastName),
    );
    const profilePath = getUserProfilePath(entry.userId, {
        friendshipStatus: isFriend ? "accepted" : null,
    });

    const identity = (
        <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
                <p className="min-w-0 truncate font-medium">
                    {displayName}
                    {isMe ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {UI.rankingYouSuffix}
                        </span>
                    ) : null}
                </p>
                {entry.isPremium ? <ProBadge /> : null}
            </div>
            {showUsername && entry.username ? (
                <UsernameLine username={entry.username} />
            ) : null}
        </div>
    );

    return (
        <Card className={cn("py-0", isMe && "bg-secondary ring-1 ring-foreground/20")}>
            <CardContent className="flex items-center gap-3 p-3">
                <span
                    className={cn(
                        "w-6 shrink-0 text-center text-sm font-semibold tabular-nums",
                        isMe ? "text-foreground" : "text-muted-foreground",
                    )}
                >
                    {entry.rank}
                </span>
                {isMe ? (
                    entry.avatarUrl ? (
                        <img
                            src={entry.avatarUrl}
                            alt=""
                            className="size-10 shrink-0 rounded-full object-cover"
                        />
                    ) : (
                        <ProfileAvatarFallback
                            initials={initials}
                            className="size-10 rounded-full text-sm"
                        />
                    )
                ) : (
                    <ProfileAvatarLink
                        userId={entry.userId}
                        avatarUrl={entry.avatarUrl}
                        initials={initials}
                        linkOptions={{
                            friendshipStatus: isFriend ? "accepted" : null,
                        }}
                    />
                )}
                {isMe ? (
                    identity
                ) : (
                    <Link
                        to={profilePath}
                        className="min-w-0 flex-1"
                        onClick={() => {
                            void hapticImpact();
                        }}
                    >
                        {identity}
                    </Link>
                )}
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-semibold tabular-nums">
                        {UI.rankingXpShort.replace(
                            "{xp}",
                            entry.xp.toLocaleString("fr-FR"),
                        )}
                    </p>
                    {entry.globalRank ? (
                        <RankBadge
                            rankId={entry.globalRank as RankId}
                            size="xs"
                        />
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

export function RankingList({
    entries,
    meUserId,
    friendUserIds,
}: RankingListProps) {
    return (
        <ul className="space-y-2">
            {entries.map((entry) => (
                <li key={entry.userId}>
                    <RankingRow
                        entry={entry}
                        isMe={entry.userId === meUserId}
                        isFriend={friendUserIds?.has(entry.userId) ?? false}
                    />
                </li>
            ))}
        </ul>
    );
}
