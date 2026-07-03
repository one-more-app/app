import { BackHeader } from "@/components/BackHeader";
import { FriendsListTab } from "@/components/friends/FriendsListTab";
import { Button } from "@/components/ui/button";
import { ACCESS_SWR_KEY, useAccess } from "@/hooks/use-access";
import { CONVERSATIONS_SWR_KEY } from "@/hooks/use-realtime";
import { fetchFriendsList } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import useSWR, { useSWRConfig } from "swr";

export default function FriendsPage() {
    const { mutate } = useSWRConfig();
    const { refresh: refreshAccess } = useAccess();
    const { data, isLoading, mutate: refreshFriends } = useSWR(
        "friends-list",
        fetchFriendsList,
    );

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
                <Button variant="secondary" className="w-full" asChild>
                    <Link to="/friends/search">
                        <UserPlus className="size-4" />
                        {UI.friendsAddTitle}
                    </Link>
                </Button>
                <FriendsListTab
                    data={data}
                    isLoading={isLoading}
                    onRefresh={refreshAll}
                />
            </main>
        </div>
    );
}
