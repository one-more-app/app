import { ProBadge } from "@/components/profile/ProBadge";
import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
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
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function ActivityUserRow({
    item,
    subtitle,
    to,
    dotClassName,
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
    dotClassName: string;
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
            className="flex items-center gap-3 rounded-[14px] bg-card px-3.5 py-3 transition-colors hover:bg-muted/30"
        >
            {item.avatarUrl ? (
                <img
                    src={item.avatarUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                />
            ) : (
                <ProfileAvatarFallback
                    initials={initials}
                    className="size-10 rounded-full text-xs"
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
                    <span
                        className={cn("size-2 shrink-0 rounded-full", dotClassName)}
                        aria-hidden
                    />
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
}: {
    items: SocialTrainingNowItem[];
}) {
    if (items.length === 0) return null;

    return (
        <section className="space-y-3" aria-labelledby="social-training-now">
            <div className="space-y-3">
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
                        dotClassName="bg-accent"
                    />
                ))}
            </div>
        </section>
    );
}

export function SocialRecentSessionsSection({
    items,
}: {
    items: SocialRecentSessionItem[];
}) {
    const todayKey = getLocalDateKey();
    if (items.length === 0) return null;

    return (
        <section className="space-y-3" aria-labelledby="social-recent-sessions">
            <div className="space-y-3">
                {items.map((item) => (
                    <ActivityUserRow
                        key={`${item.userId}:${item.activityDate}`}
                        item={item}
                        subtitle={formatSocialSessionAgo(item.activityDate, todayKey)}
                        to={item.sessionPath}
                        dotClassName="bg-[#b5b5b5]"
                    />
                ))}
            </div>
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
    if (trainingNow.length === 0 && recentSessions.length === 0) return null;

    return (
        <div className="space-y-4">
            <SocialTrainingNowSection items={trainingNow} />
            <SocialRecentSessionsSection items={recentSessions} />
        </div>
    );
}
