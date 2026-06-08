import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileSocialActions } from "@/components/profile/ProfileSocialActions";
import {
  useLeagueSummaryData,
  usePerformanceEntriesData,
  useUserProfileData,
  useUserProgressData,
} from "@/hooks/use-api-data";
import { useHomeData } from "@/hooks/use-home-data";
import { UI } from "@/lib/translations";

export default function ProfilePage() {
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
      headerActions={<ProfileSocialActions />}
    />
  );
}
