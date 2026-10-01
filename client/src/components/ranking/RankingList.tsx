import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { UsernameLine } from "@/components/profile/UsernameLine";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { RankingEntryDto } from "@/lib/ranking-api";
import {
    getProfileDisplayName,
    getProfileInitials,
} from "@/lib/profile-display";
import type { RankId } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

type RankingListProps = {
    entries: RankingEntryDto[];
    meUserId: string;
};

function RankingRow({
    entry,
    isMe,
}: {
    entry: RankingEntryDto;
    isMe: boolean;
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
                    />
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                        {displayName}
                        {isMe ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                {UI.rankingYouSuffix}
                            </span>
                        ) : null}
                    </p>
                    {showUsername && entry.username ? (
                        <UsernameLine username={entry.username} />
                    ) : null}
                </div>
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

export function RankingList({ entries, meUserId }: RankingListProps) {
    return (
        <ul className="space-y-2">
            {entries.map((entry) => (
                <li key={entry.userId}>
                    <RankingRow entry={entry} isMe={entry.userId === meUserId} />
                </li>
            ))}
        </ul>
    );
}
