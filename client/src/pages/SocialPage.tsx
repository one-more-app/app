import { SocialActivitySections } from "@/components/friends/SocialActivitySections";
import { ReferralTshirtBanner } from "@/components/referral/ReferralTshirtBanner";
import { SocialFriendsCard } from "@/components/social/SocialFriendsCard";
import { SocialRankingCard } from "@/components/social/SocialRankingCard";
import { Button } from "@/components/ui/button";
import { UnreadCountBadge } from "@/components/ui/unread-count-badge";
import { useFriendsPresence } from "@/hooks/use-friends-presence";
import { useUnreadMessagesCount } from "@/hooks/use-mark-conversation-read";
import { getLocalDateKey } from "@/lib/local-date";
import {
  acceptedFriends,
  buildRecentSessionItems,
  buildTrainingNowItems,
} from "@/lib/social-feed";
import { fetchFriendsList } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { MessageCircle, UserPlus } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";

export default function SocialPage() {
  const { data, isLoading } = useSWR("friends-list", fetchFriendsList);
  const { byUserId } = useFriendsPresence();
  const unreadMessages = useUnreadMessagesCount();

  const friends = useMemo(() => acceptedFriends(data?.friends ?? []), [data]);
  // La Map de présence est reconstruite à chaque rendu : calcul direct, volume faible.
  const trainingNow = buildTrainingNowItems(friends, byUserId, getLocalDateKey());
  const trainingUserIds = trainingNow.map((item) => item.userId);
  const recentSessions = buildRecentSessionItems(friends).filter(
    (item) => !trainingUserIds.includes(item.userId),
  );

  const messagesLabel =
    unreadMessages > 0
      ? UI.navFriendsBadgeAria
          .replace("{label}", UI.socialMessagesAria)
          .replace("{count}", String(unreadMessages))
      : UI.socialMessagesAria;

  return (
    <div className="min-h-screen-app bg-background">
      <header
        data-sticky-app-header
        className="sticky-top-safe z-100 border-b border-border bg-card px-4 py-3"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3.5">
          <h1 className="min-w-0 flex-1 truncate font-one-more text-base font-normal uppercase italic">
            {UI.socialTitle}
          </h1>
          <Button
            variant="secondary"
            size="icon"
            asChild
            className="relative rounded-[10px]"
            aria-label={messagesLabel}
          >
            <Link to="/friends">
              <MessageCircle className="size-4" aria-hidden />
              <UnreadCountBadge
                count={unreadMessages}
                size="md"
                variant="onAccent"
                className="absolute -right-1 -top-1"
              />
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            asChild
            className="rounded-[10px]"
            aria-label={UI.socialAddFriendsAria}
          >
            <Link to="/friends/search">
              <UserPlus className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <SocialRankingCard />
        <SocialFriendsCard
          friends={friends}
          trainingCount={trainingNow.length}
          trainingUserIds={trainingUserIds}
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
