import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import type { RankingListResponse } from "@/lib/ranking-api";
import { getProfileInitials } from "@/lib/profile-display";
import type { RankId } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";

type RankingMeHeaderProps = {
    me: RankingListResponse["me"];
};

export function RankingMeHeader({ me }: RankingMeHeaderProps) {
    const auth = useAuth();
    const { data: profile } = useUserProfileData();
    const initials = getProfileInitials(profile ?? null, auth.user);
    const avatarUrl = profile?.avatarUrl ?? null;

    return (
        <Card className="py-0">
            <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-full object-cover"
                        />
                    ) : (
                        <ProfileAvatarFallback
                            initials={initials}
                            className="size-12 rounded-full text-sm"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                            {UI.rankingMyRank}
                        </p>
                        <p className="text-2xl font-semibold tabular-nums">
                            {UI.rankingRankLabel.replace(
                                "{rank}",
                                String(me.rank),
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-medium tabular-nums">
                        {UI.rankingXpMonth.replace(
                            "{xp}",
                            me.xp.toLocaleString("fr-FR"),
                        )}
                    </p>
                    {me.globalRank ? (
                        <RankBadge
                            rankId={me.globalRank as RankId}
                            size="sm"
                        />
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
