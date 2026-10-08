import { trainingNowSurfaceClass } from "@/components/friends/TrainingNowBanner";
import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { ProBadge } from "@/components/profile/ProBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { presenceDotClass } from "@/hooks/use-friends-presence";
import { getLocalDateKey } from "@/lib/local-date";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import {
  formatSocialSessionAgo,
  type SocialRecentSessionItem,
  type SocialTrainingNowItem,
} from "@/lib/social-feed";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ChevronRight, Flame, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

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
        surfaceClassName ?? "border border-border/60 bg-card hover:bg-muted/30",
      )}
    >
      {item.avatarUrl ? (
        <img
          src={item.avatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <ProfileAvatarFallback
          initials={initials}
          className="size-9 rounded-full text-xs"
        />
      )}
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
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}

export function SocialTrainingNowSection({
  items,
  emptyLabel = UI.socialTrainingNowEmpty,
}: {
  items: SocialTrainingNowItem[];
  emptyLabel?: string;
}) {
  return (
    <section className="space-y-2" aria-labelledby="social-training-now">
      <h2
        id="social-training-now"
        className="flex items-center gap-1.5 text-sm font-semibold"
      >
        <Flame className="size-4 text-amber-500" aria-hidden />
        {UI.socialTrainingNowTitle}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ActivityUserRow
              key={item.userId}
              item={item}
              subtitle={
                item.exerciseName
                  ? `${UI.socialSessionLive} · ${item.exerciseName}`
                  : UI.socialSessionLive
              }
              to={item.sessionPath}
              surfaceClassName={cn(
                trainingNowSurfaceClass,
                "hover:bg-accent/15",
              )}
              showLiveDot
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function SocialRecentSessionsSection({
  items,
  emptyLabel = UI.socialRecentSessionsEmpty,
}: {
  items: SocialRecentSessionItem[];
  emptyLabel?: string;
}) {
  const todayKey = getLocalDateKey();
  return (
    <section className="space-y-2" aria-labelledby="social-recent-sessions">
      <h2
        id="social-recent-sessions"
        className="flex items-center gap-1.5 text-sm font-semibold"
      >
        <Trophy className="size-4 text-primary" aria-hidden />
        {UI.socialRecentSessionsTitle}
      </h2>
      {items.length === 0 ? (
        <EmptyState
          variant="plain"
          description={emptyLabel}
          contentClassName="py-2"
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ActivityUserRow
              key={`${item.userId}:${item.activityDate}`}
              item={item}
              subtitle={formatSocialSessionAgo(item.activityDate, todayKey)}
              to={item.sessionPath}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type SocialActivitySectionsProps = {
  trainingNow: SocialTrainingNowItem[];
  recentSessions: SocialRecentSessionItem[];
};

export function SocialActivitySections({
  trainingNow,
  recentSessions,
}: SocialActivitySectionsProps) {
  return (
    <div className="space-y-6">
      <SocialTrainingNowSection items={trainingNow} />
      <SocialRecentSessionsSection items={recentSessions} />
    </div>
  );
}
