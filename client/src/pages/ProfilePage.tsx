import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileSocialActions } from "@/components/profile/ProfileSocialActions";
import {
  useLeagueSummaryData,
  usePerformanceEntriesData,
  useUserProfileData,
  useUserProgressData,
} from "@/hooks/use-api-data";
import { useAccess } from "@/hooks/use-access";
import { useAuth } from "@/hooks/use-auth";
import { useHomeData } from "@/hooks/use-home-data";
import { useTheme } from "@/hooks/use-theme";
import {
  getMostTrainedExercise,
  topExerciseToHighlight,
} from "@/lib/profile-highlights";
import { getProfileDisplayName } from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { useMemo } from "react";

export default function ProfilePage() {
  const auth = useAuth();
  const { exercises, hasLoaded } = useHomeData();
  const { data: profile } = useUserProfileData();
  const { data: progress } = useUserProgressData();
  const { data: performanceEntries } = usePerformanceEntriesData();
  const { data: leagueSummary } = useLeagueSummaryData();
  const { access, isLimited } = useAccess();
  const { resolvedTheme } = useTheme();

  const sharePayload = useMemo(() => {
    if (!profile || !progress) return null;
    const topRow = leagueSummary?.topByLeague?.[0];
    return {
      displayName: getProfileDisplayName(profile, auth.user),
      progress,
      leagueSummary: leagueSummary ?? null,
      topByLeague: topRow
        ? topExerciseToHighlight(topRow, exercises)
        : null,
      mostTrained: getMostTrainedExercise(
        exercises,
        performanceEntries ?? [],
      ),
    };
  }, [
    profile,
    progress,
    leagueSummary,
    exercises,
    performanceEntries,
    auth.user,
  ]);

  return (
    <ProfileView
      pageTitle={UI.profile}
      data={{
        profile,
        progress,
        exercises,
        performanceEntries: performanceEntries ?? [],
        leagueSummary: leagueSummary ?? null,
        isLoading: !hasLoaded,
      }}
      headerActions={
        <>
          <ProfileSocialActions
            sharePayload={sharePayload}
            isDark={resolvedTheme === "dark"}
            showUnlockHint={isLimited}
            validatedInvitesCount={access?.validatedInvitesCount ?? 0}
          />
        </>
      }
    />
  );
}
