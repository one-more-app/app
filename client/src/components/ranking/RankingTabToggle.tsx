import { hapticTab } from "@/lib/haptics";
import type { RankingTab } from "@/lib/ranking-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Dumbbell, Users } from "lucide-react";

const TAB_ITEMS: { id: RankingTab; label: string; Icon: typeof Users }[] = [
    { id: "gym", label: UI.rankingTabGym, Icon: Dumbbell },
    { id: "friends", label: UI.rankingTabFriends, Icon: Users },
];

type RankingTabToggleProps = {
    value: RankingTab;
    onChange: (tab: RankingTab) => void;
};

export function RankingTabToggle({ value, onChange }: RankingTabToggleProps) {
    return (
        <div
            className="flex gap-1 rounded-xl bg-card p-1"
            role="tablist"
            aria-label={UI.rankingTitle}
        >
            {TAB_ITEMS.map(({ id, label, Icon }) => {
                const active = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`ranking-panel-${id}`}
                        id={`ranking-tab-${id}`}
                        onClick={() => {
                            if (!active) hapticTab();
                            onChange(id);
                        }}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 sm:gap-2 cursor-pointer",
                            "text-sm font-medium transition-[color,transform,background-color]",
                            "active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                            active
                                ? "bg-primary text-primary-foreground dark:bg-primary-foreground dark:text-primary"
                                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                        )}
                    >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
