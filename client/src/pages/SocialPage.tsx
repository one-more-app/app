import { BackHeader } from "@/components/BackHeader";
import { SocialActivitySections } from "@/components/friends/SocialActivitySections";
import { ReferralTshirtBanner } from "@/components/referral/ReferralTshirtBanner";
import { SocialFriendsCard } from "@/components/social/SocialFriendsCard";
import { SocialRankingCard } from "@/components/social/SocialRankingCard";
import { Button } from "@/components/ui/button";
import { useFriendsBadgeCount } from "@/hooks/use-friends-badge-count";
import { useFriendsPresence } from "@/hooks/use-friends-presence";
import { getLocalDateKey } from "@/lib/local-date";
import {
  acceptedFriends,
  buildRecentSessionItems,
  buildTrainingNowItems,
} from "@/lib/social-feed";
import { fetchFriendsList } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { UserPlus } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";

export default function SocialPage() {
  const { data, isLoading } = useSWR("friends-list", fetchFriendsList);
  const { byUserId } = useFriendsPresence();
  const unreadCount = useFriendsBadgeCount();

  const friends = useMemo(() => acceptedFriends(data?.friends ?? []), [data]);
  // La Map de présence est reconstruite à chaque rendu : calcul direct, volume faible.
  const trainingNow = buildTrainingNowItems(friends, byUserId, getLocalDateKey());
  const recentSessions = useMemo(() => buildRecentSessionItems(friends), [friends]);

  return (
    <div className="min-h-screen-app bg-background">
      <BackHeader
        title={UI.socialTitle}
        right={
          <Button
            variant="secondary"
            size="icon"
            asChild
            aria-label={UI.socialAddFriendsAria}
          >
            <Link to="/friends/search">
              <UserPlus className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <SocialRankingCard />
        <SocialFriendsCard
          friends={friends}
          trainingCount={trainingNow.length}
          unreadCount={unreadCount}
          isLoading={isLoading}
        />
        <ReferralTshirtBanner />
        <SocialActivitySections
          trainingNow={trainingNow}
          recentSessions={recentSessions}
        />
      </main>
    </div>
  );
}
