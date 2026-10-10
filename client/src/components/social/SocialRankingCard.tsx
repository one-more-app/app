import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { RankBadge } from "@/components/RankBadge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { hapticImpact } from "@/lib/haptics";
import { getProfileInitials } from "@/lib/profile-display";
import {
  fetchFriendsRanking,
  fetchGymRanking,
  type RankingListResponse,
} from "@/lib/ranking-api";
import { getCurrentRankingMonth } from "@/lib/ranking-month";
import type { RankId } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { Link } from "react-router-dom";
import useSWR from "swr";

type RankingCardData = {
  me: RankingListResponse["me"];
  placeName: string | null;
};

/**
 * Rang du mois : classement salle si la salle est active et opt-in,
 * sinon classement entre potes. Mêmes clés SWR que `RankingPage`.
 */
function useSocialRankingCard(): {
  data: RankingCardData | null;
  isLoading: boolean;
} {
  const month = getCurrentRankingMonth();
  const gymSwr = useSWR(["ranking-gym", month, null], ([, m]) =>
    fetchGymRanking(m as string, { placeId: null }),
  );
  const gymMeta = gymSwr.data?.meta;
  const gymUsable =
    gymMeta?.hasGym === true &&
    gymMeta.rankingOptIn === true &&
    gymMeta.foreignGym !== true;
  const gymSettled = gymSwr.data != null || gymSwr.error != null;

  const friendsSwr = useSWR(
    gymSettled && !gymUsable ? ["ranking-friends", month] : null,
    ([, m]) => fetchFriendsRanking(m as string),
  );

  if (gymUsable && gymSwr.data) {
    return {
      data: { me: gymSwr.data.me, placeName: gymMeta?.placeName ?? null },
      isLoading: false,
    };
  }
  if (friendsSwr.data) {
    return {
      data: { me: friendsSwr.data.me, placeName: null },
      isLoading: false,
    };
  }
  return {
    data: null,
    isLoading: !gymSettled || friendsSwr.isLoading,
  };
}

export function SocialRankingCard() {
  const auth = useAuth();
  const { data: profile } = useUserProfileData();
  const initials = getProfileInitials(profile ?? undefined, auth.user);
  const avatarUrl = profile?.avatarUrl ?? null;
  const { data, isLoading } = useSocialRankingCard();

  const rank = data && data.me.rank > 0 ? data.me.rank : null;
  const label = data?.placeName
    ? UI.socialRankingCardLabelPlace.replace("{place}", data.placeName)
    : UI.socialRankingCardLabel;

  return (
    <Card className="py-0 transition-colors hover:bg-muted/25">
      <Link
        to="/ranking"
        aria-label={UI.socialRankingCardAria}
        className="flex items-center gap-3 p-3"
        onClick={() => {
          void hapticImpact();
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <ProfileAvatarFallback
            initials={initials}
            className="size-12 rounded-full text-sm"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : rank != null ? (
            <p className="font-one-more text-2xl font-semibold italic tabular-nums">
              {UI.rankingRankLabel.replace("{rank}", String(rank))}
            </p>
          ) : (
            <p className="text-sm font-medium">{UI.socialRankingUnranked}</p>
          )}
        </div>
        {data ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="text-sm font-medium tabular-nums">
              {UI.rankingXpShort.replace(
                "{xp}",
                data.me.xp.toLocaleString("fr-FR"),
              )}
            </p>
            {data.me.globalRank ? (
              <RankBadge rankId={data.me.globalRank as RankId} size="sm" />
            ) : null}
          </div>
        ) : null}
      </Link>
    </Card>
  );
}
