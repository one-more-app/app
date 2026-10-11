import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import type { RankingTab } from "@/lib/ranking-api";
import { UI } from "@/lib/translations";
import { Dumbbell, Users } from "lucide-react";

const TAB_ITEMS = [
    { id: "gym" as const, label: UI.rankingTabGym, Icon: Dumbbell },
    { id: "friends" as const, label: UI.rankingTabFriends, Icon: Users },
];

type RankingTabToggleProps = {
    value: RankingTab;
    onChange: (tab: RankingTab) => void;
};

export function RankingTabToggle({ value, onChange }: RankingTabToggleProps) {
    return (
        <SegmentedToggle
            value={value}
            onChange={onChange}
            items={TAB_ITEMS}
            ariaLabel={UI.rankingTitle}
            idPrefix="ranking"
        />
    );
}
