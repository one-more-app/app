import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { RankingEntryDto } from "@/lib/ranking-api";
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
    const name = entry.username ? `@${entry.username}` : UI.rankingNoUsername;
    const initials = (entry.username ?? UI.rankingNoUsername)
        .slice(0, 2)
        .toUpperCase();

    return (
        <Card className={cn("py-0", isMe && "ring-2 ring-primary/40")}>
            <CardContent className="flex items-center gap-3 p-3">
                <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                    {UI.rankingRankLabel.replace("{rank}", String(entry.rank))}
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
                        {name}
                        {isMe ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                {UI.rankingYouSuffix}
                            </span>
                        ) : null}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                        {UI.rankingXpShort.replace(
                            "{xp}",
                            entry.xp.toLocaleString("fr-FR"),
                        )}
                    </p>
                </div>
                {entry.globalRank ? (
                    <RankBadge rankId={entry.globalRank as RankId} size="xs" />
                ) : null}
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
