import { NotificationFeedControl } from "@/components/notifications/NotificationFeedDrawer";
import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { RankBadge } from "@/components/RankBadge";
import { useLeagueSummaryData, useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { getProfileAvatarUrl } from "@/lib/profile-avatar";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";

type HomeHeaderProps = {
    ownerUserId?: string;
};

export function HomeHeader({ ownerUserId }: HomeHeaderProps) {
    const auth = useAuth();
    const { data: profile } = useUserProfileData();
    const { data: leagueSummary } = useLeagueSummaryData();

    const authUser = auth.status === "authenticated" ? auth.user : null;
    const name = getProfileDisplayName(profile, authUser);
    const initials = getProfileInitials(profile, authUser);
    const avatarUrl = profile?.avatarUrl ?? getProfileAvatarUrl(ownerUserId);

    return (
        <header className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                {ownerUserId ? (
                    <ProfileAvatarLink
                        userId={ownerUserId}
                        avatarUrl={avatarUrl}
                        initials={initials}
                        sizeClassName="size-11"
                        textSizeClassName="text-sm bg-card"
                        linkOptions={{ isSelf: true }}
                    />
                ) : null}
                <div className="flex min-w-0 flex-col items-start gap-1">
                    <p className="max-w-full truncate font-one-more text-sm font-semibold uppercase italic tracking-tight">
                        {name}
                    </p>
                    {leagueSummary?.globalRank ? (
                        <RankBadge rankId={leagueSummary.globalRank} size="sm" />
                    ) : null}
                </div>
            </div>
            <NotificationFeedControl />
        </header>
    );
}
