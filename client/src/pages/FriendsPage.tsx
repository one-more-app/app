import { BackHeader } from "@/components/BackHeader";
import { FriendsListTab } from "@/components/friends/FriendsListTab";
import { FriendsMessagesTab } from "@/components/friends/FriendsMessagesTab";
import { FriendsSearchTab } from "@/components/friends/FriendsSearchTab";
import {
    FriendsTabToggle,
    type FriendsTab,
} from "@/components/friends/FriendsTabToggle";
import { ACCESS_SWR_KEY, useAccess } from "@/hooks/use-access";
import { useUnreadMessagesCount } from "@/hooks/use-mark-conversation-read";
import { CONVERSATIONS_SWR_KEY } from "@/hooks/use-realtime";
import { fetchFriendsList } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

export default function FriendsPage() {
    const { mutate } = useSWRConfig();
    const { access, refresh: refreshAccess } = useAccess();
    const [tab, setTab] = useState<FriendsTab>("friends");
    const { data, isLoading, mutate: refreshFriends } = useSWR(
        "friends-list",
        fetchFriendsList,
    );
    const unreadTotal = useUnreadMessagesCount();

    const refreshAll = async () => {
        await Promise.all([
            refreshFriends(),
            refreshAccess(),
            mutate(ACCESS_SWR_KEY),
            mutate(CONVERSATIONS_SWR_KEY),
        ]);
    };

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader title={UI.friendsTitle} />
            <main className="mx-auto max-w-2xl space-y-4 p-4">
                <FriendsTabToggle
                    value={tab}
                    onChange={setTab}
                    messagesUnread={unreadTotal}
                />

                <div
                    role="tabpanel"
                    id={`friends-panel-${tab}`}
                    aria-labelledby={`friends-tab-${tab}`}
                    className="space-y-6"
                >
                    {tab === "friends" ? (
                        <FriendsListTab
                            data={data}
                            isLoading={isLoading}
                            onRefresh={refreshAll}
                        />
                    ) : null}
                    {tab === "search" ? (
                        <FriendsSearchTab onRefreshFriends={() => void refreshFriends()} />
                    ) : null}
                    {tab === "messages" ? <FriendsMessagesTab /> : null}
                </div>
            </main>
        </div>
    );
}
