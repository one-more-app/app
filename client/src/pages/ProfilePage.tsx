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
import { UI } from "@/lib/translations";

export default function ProfilePage() {
  const auth = useAuth();
  const { exercises, hasLoaded } = useHomeData();
  const { data: profile } = useUserProfileData();
  const { data: progress } = useUserProgressData();
  const { data: performanceEntries } = usePerformanceEntriesData();
  const { data: leagueSummary } = useLeagueSummaryData();

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
        isLoading: !hasLoaded,
      }}
      headerActions={<ReferralTshirtBanner />}
      sessionOwnerUserId={
        auth.status === "authenticated" ? auth.user?.id : undefined
      }
    />
  );
}
