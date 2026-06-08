import { hapticTab } from "@/lib/haptics";
import { profileNestedClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { MessageCircle, Search, Users } from "lucide-react";

export type FriendsTab = "friends" | "search" | "messages";

const TAB_ITEMS: {
    id: FriendsTab;
    label: string;
    Icon: typeof Users;
}[] = [
        { id: "friends", label: UI.friendsTabList, Icon: Users },
        { id: "search", label: UI.friendsTabSearch, Icon: Search },
        { id: "messages", label: UI.friendsTabMessages, Icon: MessageCircle },
    ];

type FriendsTabToggleProps = {
    value: FriendsTab;
    onChange: (tab: FriendsTab) => void;
    messagesUnread?: number;
};

export function FriendsTabToggle({
    value,
    onChange,
    messagesUnread = 0,
}: FriendsTabToggleProps) {
    return (
        <div
            className={cn(profileNestedClass, "flex gap-1 p-1")}
            role="tablist"
            aria-label={UI.friendsTitle}
        >
            {TAB_ITEMS.map(({ id, label, Icon }) => {
                const active = value === id;
                const showBadge = id === "messages" && messagesUnread > 0;

                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`friends-panel-${id}`}
                        id={`friends-tab-${id}`}
                        onClick={() => {
                            if (!active) hapticTab();
                            onChange(id);
                        }}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 sm:gap-2 cursor-pointer",
                            "text-sm font-medium transition-[color,transform,background-color]",
                            "active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary",
                            active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-card/80 hover:text-foreground",
                        )}
                    >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{label}</span>
                        {showBadge ? (
                            <span
                                className={cn(
                                    "flex min-h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
                                    active
                                        ? "bg-accent-foreground text-accent"
                                        : "bg-primary text-primary-foreground",
                                )}
                            >
                                {messagesUnread > 9 ? "9+" : messagesUnread}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
