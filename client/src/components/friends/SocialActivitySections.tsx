import { trainingNowSurfaceClass } from "@/components/friends/TrainingNowBanner";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { ProBadge } from "@/components/profile/ProBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { presenceDotClass } from "@/hooks/use-friends-presence";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import type {
  SocialRecentProgressItem,
  SocialTrainingNowItem,
} from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Flame, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

function userLinkOptions(isFriend: boolean) {
  return {
    friendshipStatus: isFriend ? ("accepted" as const) : null,
  };
}

function ActivityUserRow({
  item,
  subtitle,
  to,
  surfaceClassName,
  showLiveDot = false,
}: {
  item: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
    isPremium: boolean;
    isFriend: boolean;
  };
  subtitle: string;
  to: string;
  surfaceClassName?: string;
  showLiveDot?: boolean;
}) {
  const profile = {
    firstName: item.firstName ?? undefined,
    lastName: item.lastName ?? undefined,
    username: item.username ?? undefined,
  };
  const name = getProfileDisplayName(profile, null);
  const initials = getProfileInitials(profile, null);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors",
        surfaceClassName ??
          "border border-border/60 hover:bg-muted/30",
      )}
    >
      <ProfileAvatarLink
        userId={item.userId}
        avatarUrl={item.avatarUrl}
        initials={initials}
        sizeClassName="size-9"
        linkOptions={userLinkOptions(item.isFriend)}
        stopPropagation
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">
          {name}
          {item.isPremium ? (
            <ProBadge className="ml-1.5 inline-flex align-middle" />
          ) : null}
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {showLiveDot ? (
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                presenceDotClass("training"),
              )}
              aria-hidden
            />
          ) : null}
          <span className="truncate">{subtitle}</span>
        </p>
      </div>
    </Link>
  );
}

type SocialActivitySectionsProps = {
  trainingNow: SocialTrainingNowItem[];
  recentProgress: SocialRecentProgressItem[];
  emptyTrainingLabel?: string;
  emptyProgressLabel?: string;
};

export function SocialActivitySections({
  trainingNow,
  recentProgress,
  emptyTrainingLabel = UI.friendsTrainingNowEmpty,
  emptyProgressLabel = UI.friendsRecentProgressEmpty,
}: SocialActivitySectionsProps) {
  return (
    <div className="space-y-4">
      <section className="space-y-2" aria-labelledby="social-training-now">
        <h2
          id="social-training-now"
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <Flame className="size-4 text-amber-500" aria-hidden />
          {UI.friendsTrainingNow}
        </h2>
        {trainingNow.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyTrainingLabel}</p>
        ) : (
          <div className="space-y-2">
            {trainingNow.map((item) => {
              const to = item.isFriend
                ? `/friends/${item.userId}`
                : `/friends/preview/${item.userId}`;
              return (
                <ActivityUserRow
                  key={item.userId}
                  item={item}
                  subtitle={
                    item.exerciseName?.trim()
                      ? item.exerciseName
                      : UI.friendsTrainingGeneric
                  }
                  to={to}
                  surfaceClassName={cn(
                    trainingNowSurfaceClass,
                    "hover:bg-accent/15",
                  )}
                  showLiveDot
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="social-recent-progress">
        <h2
          id="social-recent-progress"
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <Trophy className="size-4 text-primary" aria-hidden />
          {UI.friendsRecentProgress}
        </h2>
        {recentProgress.length === 0 ? (
          <EmptyState
            variant="plain"
            description={emptyProgressLabel}
            contentClassName="py-2"
          />
        ) : (
          <div className="space-y-2">
            {recentProgress.map((item) => {
              const to =
                item.sessionPath ??
                (item.isFriend
                  ? `/friends/${item.userId}`
                  : `/friends/preview/${item.userId}`);
              const label = `${item.exerciseName} · ${item.weight} kg × ${item.reps}`;
              return (
                <ActivityUserRow
                  key={`${item.userId}:${item.activityDate}:${item.exerciseName}`}
                  item={item}
                  subtitle={label}
                  to={to}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
