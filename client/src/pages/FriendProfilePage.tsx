import { FriendTrainingBell } from "@/components/friends/FriendTrainingBell";
import { ProfileView } from "@/components/profile/ProfileView";
import { Button } from "@/components/ui/button";
import { useFriendsPresence } from "@/hooks/use-friends-presence";
import { getOrCreateConversation } from "@/lib/messaging-api";
import { fetchFriendsRanking } from "@/lib/ranking-api";
import { getCurrentRankingMonth } from "@/lib/ranking-month";
import {
  fetchFriendProfile,
  removeFriend,
} from "@/lib/social-api";
import { getProfileDisplayName } from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { MessageCircle, Trophy, UserMinus } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

export default function FriendProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { byUserId } = useFriendsPresence();
  const { data, isLoading, error } = useSWR(
    userId ? ["friend-profile", userId] : null,
    () => fetchFriendProfile(userId!),
  );

  const currentMonth = getCurrentRankingMonth();
  const { data: friendsRanking } = useSWR(
    userId ? ["ranking-friends-lite", currentMonth] : null,
    ([, month]) => fetchFriendsRanking(month, { lite: true }),
  );

  const friendRankLabel = useMemo(() => {
    if (!userId || !friendsRanking?.entries.length) return null;
    const entry = friendsRanking.entries.find((e) => e.userId === userId);
    if (!entry) return null;
    const total = friendsRanking.total ?? friendsRanking.entries.length;
    return UI.rankingFriendRank
      .replace("{rank}", String(entry.rank))
      .replace("{total}", String(total));
  }, [userId, friendsRanking]);

  const presence = userId ? byUserId.get(userId) : undefined;
  const pageTitle = data?.profile
    ? getProfileDisplayName(data.profile, null)
    : UI.profile;

  const handleRemove = () => {
    if (!userId || !window.confirm(UI.friendRemoveConfirm)) return;
    void (async () => {
      try {
        await removeFriend(userId);
        toast.success(UI.friendRemoved);
        navigate("/friends");
      } catch {
        toast.error(UI.friendActionError);
      }
    })();
  };

  const handleMessage = () => {
    if (!userId) return;
    void (async () => {
      try {
        const conv = await getOrCreateConversation(userId);
        navigate(`/friends/chat/${conv.id}`);
      } catch {
        toast.error(UI.friendActionError);
      }
    })();
  };

  const headerActions = userId ? (
    <div className="space-y-3">
      {friendRankLabel ? (
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Trophy className="size-4 shrink-0" aria-hidden />
          <span>{friendRankLabel}</span>
        </p>
      ) : null}
      <div className="flex gap-2">
      <FriendTrainingBell friendId={userId} />
      <Button variant="secondary" className="flex-1" onClick={handleMessage}>
        <MessageCircle className="size-4" />
        {UI.messageOpenChat}
      </Button>
      <Button variant="outline" className="flex-1" onClick={handleRemove}>
        <UserMinus className="size-4" />
        {UI.friendRemove}
      </Button>
      </div>
    </div>
  ) : null;

  return (
    <ProfileView
      pageTitle={pageTitle}
      readOnly
      headerActions={headerActions}
      data={{
        profile: data?.profile,
        progress: data?.progress,
        exercises: data?.exercises ?? [],
        performanceEntries: data?.performanceEntries ?? [],
        leagueSummary: data?.leagueSummary ?? null,
        topByLeague: data?.leagueSummary?.topByLeague,
        isLoading,
        error: Boolean(error),
      }}
      sessionOwnerUserId={userId}
      isFriendPresenceTraining={presence?.status === "training"}
    />
  );
}
