import { BackHeader } from "@/components/BackHeader";
import { FriendsSearchTab } from "@/components/friends/FriendsSearchTab";
import { ACCESS_SWR_KEY, useAccess } from "@/hooks/use-access";
import { CONVERSATIONS_SWR_KEY } from "@/hooks/use-realtime";
import { fetchFriendsList } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import useSWR, { useSWRConfig } from "swr";

export default function FriendSearchPage() {
    const { mutate } = useSWRConfig();
    const { refresh: refreshAccess } = useAccess();
    const { mutate: refreshFriends } = useSWR("friends-list", fetchFriendsList);

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
            <BackHeader title={UI.friendsAddTitle} />
            <main className="mx-auto max-w-2xl p-4">
                <FriendsSearchTab
                    autoFocus
                    onRefreshFriends={() => void refreshAll()}
                />
            </main>
        </div>
    );
}
