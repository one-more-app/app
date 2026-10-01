import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import type { RankingRecapResponse } from "@/lib/ranking-api";
import { formatRankingMonthLabel } from "@/lib/ranking-month";
import { UI } from "@/lib/translations";

type RankingRecapSheetProps = {
    recap: RankingRecapResponse | null;
    open: boolean;
    onDismiss: () => void;
};

export function RankingRecapSheet({
    recap,
    open,
    onDismiss,
}: RankingRecapSheetProps) {
    return (
        <Drawer
            open={open && recap != null}
            data-analytics-label="ranking-recap"
            onOpenChange={(next) => {
                if (!next) onDismiss();
            }}
        >
            <DrawerContent className="max-h-[92vh]">
                {recap ? (
                    <div className="mx-auto w-full max-w-lg overflow-y-auto px-4 pb-8">
                        <DrawerHeader className="px-0 text-left">
                            <DrawerTitle className="capitalize">
                                {UI.rankingRecapTitle.replace(
                                    "{month}",
                                    formatRankingMonthLabel(recap.month),
                                )}
                            </DrawerTitle>
                            <DrawerDescription>
                                {UI.rankingRecapBody
                                    .replace(
                                        "{xp}",
                                        recap.xp.toLocaleString("fr-FR"),
                                    )
                                    .replace("{days}", String(recap.activeDays))}
                            </DrawerDescription>
                        </DrawerHeader>
                        <ul className="space-y-1 pb-4 text-sm font-medium">
                            {recap.friends ? (
                                <li>
                                    {UI.rankingRecapFriendsRank
                                        .replace(
                                            "{rank}",
                                            String(recap.friends.rank),
                                        )
                                        .replace(
                                            "{total}",
                                            String(recap.friends.total),
                                        )}
                                </li>
                            ) : null}
                            {recap.gym ? (
                                <li>
                                    {UI.rankingRecapGymRank
                                        .replace("{rank}", String(recap.gym.rank))
                                        .replace(
                                            "{total}",
                                            String(recap.gym.total),
                                        )}
                                </li>
                            ) : null}
                        </ul>
                        <Button className="w-full" onClick={onDismiss}>
                            {UI.rankingRecapCta}
                        </Button>
                    </div>
                ) : null}
            </DrawerContent>
        </Drawer>
    );
}
