import { Button } from "@/components/ui/button";
import { hapticImpact } from "@/lib/haptics";
import {
    formatRankingMonthLabel,
    getCurrentRankingMonth,
    shiftRankingMonth,
} from "@/lib/ranking-month";
import { UI } from "@/lib/translations";
import { ChevronLeft, ChevronRight } from "lucide-react";

type RankingMonthNavProps = {
    month: string;
    onChange: (month: string) => void;
};

export function RankingMonthNav({ month, onChange }: RankingMonthNavProps) {
    const isCurrentOrFuture = month >= getCurrentRankingMonth();

    return (
        <div className="flex items-center justify-between gap-2">
            <Button
                variant="secondary"
                size="icon"
                aria-label={UI.rankingMonthPrev}
                onClick={() => {
                    void hapticImpact();
                    onChange(shiftRankingMonth(month, -1));
                }}
            >
                <ChevronLeft className="size-4" />
            </Button>
            <p className="text-sm font-medium capitalize" aria-live="polite">
                {formatRankingMonthLabel(month)}
            </p>
            <Button
                variant="secondary"
                size="icon"
                aria-label={UI.rankingMonthNext}
                disabled={isCurrentOrFuture}
                onClick={() => {
                    void hapticImpact();
                    onChange(shiftRankingMonth(month, 1));
                }}
            >
                <ChevronRight className="size-4" />
            </Button>
        </div>
    );
}
