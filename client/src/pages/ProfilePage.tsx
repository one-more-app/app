import { ReferralTshirtBanner } from "@/components/referral/ReferralTshirtBanner";
import { ProfileView } from "@/components/profile/ProfileView";
import {
  useLeagueSummaryData,
  usePerformanceEntriesData,
  useUserProfileData,
  useUserProgressData,
} from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { useHomeData } from "@/hooks/use-home-data";
import { fetchMyBadges } from "@/lib/badges-api";
import { UI } from "@/lib/translations";
import useSWR from "swr";

export default function ProfilePage() {
  const auth = useAuth();
  const { exercises, hasLoaded } = useHomeData();
  const { data: profile } = useUserProfileData();
  const { data: progress } = useUserProgressData();
  const { data: performanceEntries } = usePerformanceEntriesData();
  const { data: leagueSummary } = useLeagueSummaryData();
  const { data: badges } = useSWR(
    auth.status === "authenticated" ? "badges-me" : null,
    () => fetchMyBadges(),
  );

  return (
    <ProfileView
      pageTitle={UI.profile}
      data={{
        profile,
        progress,
        exercises,
        performanceEntries: performanceEntries ?? [],
        leagueSummary: leagueSummary ?? null,
        topByLeague: leagueSummary?.topByLeague,
        badges: badges ?? [],
        isLoading: !hasLoaded,
      }}
      headerActions={<ReferralTshirtBanner />}
      sessionOwnerUserId={
        auth.status === "authenticated" ? auth.user?.id : undefined
      }
    />
  );
}
