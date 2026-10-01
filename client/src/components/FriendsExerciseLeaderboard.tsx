import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { ProBadge } from "@/components/profile/ProBadge";
import { UsernameLine } from "@/components/profile/UsernameLine";
import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useUserProfileData } from "@/hooks/use-api-data";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import {
  fetchFriendsExerciseLeaderboard,
  friendsExerciseLeaderboardSwrKey,
  type FriendsExerciseLeaderboardEntry,
} from "@/lib/social-api";
import type { RankId } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import useSWR from "swr";

type FriendsExerciseLeaderboardProps = {
  catalogExerciseId: string | null;
  isCustom: boolean;
  refreshToken?: number | string;
  className?: string;
};

function formatSourceSet(weight: number, reps: number): string {
  const weightLabel = Number.isInteger(weight)
    ? String(weight)
    : weight.toFixed(1);
  return UI.friendsExerciseLeaderboardSourceSet
    .replace("{weight}", weightLabel)
    .replace("{reps}", String(reps));
}

function LeaderboardRow({
  entry,
  meAvatarUrl,
  meProfile,
}: {
  entry: FriendsExerciseLeaderboardEntry;
  meAvatarUrl: string | null;
  meProfile: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  } | null;
}) {
  const profile = entry.isMe
    ? {
        firstName: meProfile?.firstName ?? entry.firstName ?? undefined,
        lastName: meProfile?.lastName ?? entry.lastName ?? undefined,
        username: meProfile?.username ?? entry.username ?? undefined,
      }
    : {
        firstName: entry.firstName ?? undefined,
        lastName: entry.lastName ?? undefined,
        username: entry.username ?? undefined,
      };
  const displayName = getProfileDisplayName(profile, null);
  const initials = getProfileInitials(profile, null);
  const showUsername = Boolean(
    profile.username && (profile.firstName || profile.lastName),
  );
  const avatarUrl = entry.isMe
    ? (meAvatarUrl ?? entry.avatarUrl)
    : entry.avatarUrl;

  const content = (
    <Card className={cn("py-0", entry.isMe && "bg-secondary ring-1 ring-foreground/20")}>
      <CardContent className="flex items-center gap-3 p-3">
        <span
          className={cn(
            "w-6 shrink-0 text-center text-sm font-semibold tabular-nums",
            entry.isMe ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {entry.rank}
        </span>
        {entry.isMe ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <ProfileAvatarFallback
              initials={initials}
              className="size-10 rounded-full text-sm"
            />
          )
        ) : (
          <ProfileAvatarLink
            userId={entry.userId}
            avatarUrl={avatarUrl}
            initials={initials}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="min-w-0 truncate font-medium">
              {displayName}
              {entry.isMe ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {UI.rankingYouSuffix}
                </span>
              ) : null}
            </p>
            {entry.isPremium ? <ProBadge /> : null}
          </div>
          {showUsername && profile.username ? (
            <UsernameLine username={profile.username} />
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-sm font-semibold tabular-nums">
            {formatSourceSet(entry.sourceWeight, entry.sourceReps)}
          </p>
          {entry.rankId ? (
            <RankBadge rankId={entry.rankId as RankId} size="xs" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (entry.isMe) return content;

  return (
    <Link
      to={`/friends/${entry.userId}`}
      className="block rounded-lg transition-colors"
    >
      {content}
    </Link>
  );
}

export function FriendsExerciseLeaderboard({
  catalogExerciseId,
  isCustom,
  refreshToken,
  className,
}: FriendsExerciseLeaderboardProps) {
  const { data: profile } = useUserProfileData();
  const meAvatarUrl = profile?.avatarUrl ?? null;

  const canFetch =
    !isCustom &&
    !!catalogExerciseId &&
    !catalogExerciseId.startsWith("custom-");

  const { data, error, isLoading, mutate } = useSWR(
    canFetch
      ? [...friendsExerciseLeaderboardSwrKey(catalogExerciseId!), refreshToken]
      : null,
    () => fetchFriendsExerciseLeaderboard(catalogExerciseId!),
  );

  const entries = Array.isArray(data?.entries) ? data.entries : null;
  const leaderboardError = Boolean(error) || (data != null && entries == null);
  const hasComparableFriends = entries?.some((entry) => !entry.isMe) ?? false;

  return (
    <Card
      className={cn("gap-0", className)}
      data-tour="exercise-friends-leaderboard"
    >
      <CardHeader className="gap-0">
        <CardTitle>{UI.friendsExerciseLeaderboardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!canFetch ? (
          <EmptyState
            variant="plain"
            icon={Users}
            title={UI.friendsExerciseLeaderboardCatalogOnly}
            className="py-4"
          />
        ) : isLoading && !data ? (
          <p className="py-4 text-center text-sm text-muted-foreground">…</p>
        ) : leaderboardError ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-sm text-muted-foreground">
              {UI.friendsExerciseLeaderboardError}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void mutate()}
            >
              {UI.connectivityRetry}
            </Button>
          </div>
        ) : !hasComparableFriends ? (
          <div className="flex flex-col gap-3">
            {entries?.length ? (
              <ul className="space-y-2">
                {(entries ?? []).map((entry) => (
                  <li key={entry.userId}>
                    <LeaderboardRow
                      entry={entry}
                      meAvatarUrl={meAvatarUrl}
                      meProfile={profile ?? null}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            <EmptyState
              variant="plain"
              icon={Users}
              title={UI.friendsExerciseLeaderboardEmpty}
              className="py-3"
            >
              <Button asChild variant="secondary" size="sm">
                <Link to="/friends">{UI.friendsExerciseLeaderboardCta}</Link>
              </Button>
            </EmptyState>
          </div>
        ) : (
          <ul className="space-y-2">
            {(entries ?? []).map((entry) => (
              <li key={entry.userId}>
                <LeaderboardRow
                  entry={entry}
                  meAvatarUrl={meAvatarUrl}
                  meProfile={profile ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
