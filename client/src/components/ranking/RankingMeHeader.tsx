import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { RankingListResponse } from "@/lib/ranking-api";
import { UI } from "@/lib/translations";
import type { RankId } from "@/lib/strength-standards";

type RankingMeHeaderProps = {
    me: RankingListResponse["me"];
};

export function RankingMeHeader({ me }: RankingMeHeaderProps) {
    return (
        <Card className="py-0">
            <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                        {UI.rankingMyRank}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                        {UI.rankingRankLabel.replace("{rank}", String(me.rank))}
                    </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-medium tabular-nums">
                        {UI.rankingXpMonth.replace(
                            "{xp}",
                            me.xp.toLocaleString("fr-FR"),
                        )}
                    </p>
                    {me.globalRank ? (
                        <RankBadge rankId={me.globalRank as RankId} size="sm" />
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
