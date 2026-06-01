import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileSocialActions } from "@/components/profile/ProfileSocialActions";
import { Button } from "@/components/ui/button";
import {
  usePerformanceEntriesData,
  useUserProfileData,
  useUserProgressData,
} from "@/hooks/use-api-data";
import { useAccess } from "@/hooks/use-access";
import { useAuth } from "@/hooks/use-auth";
import { useHomeData } from "@/hooks/use-home-data";
import { useTheme } from "@/hooks/use-theme";
import { computeLeagueStatsForTracked } from "@/lib/muscle-league-stats";
import {
  getMostTrainedExercise,
  getTopExerciseByLeague,
} from "@/lib/profile-highlights";
import { getProfileDisplayName } from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const auth = useAuth();
  const { exercises, hasLoaded } = useHomeData();
  const { data: profile } = useUserProfileData();
  const { data: progress } = useUserProgressData();
  const { data: performanceEntries } = usePerformanceEntriesData();
  const { access, isLimited } = useAccess();
  const { resolvedTheme } = useTheme();

  const leagueSummary = useMemo(() => {
    if (!profile) return null;
    return computeLeagueStatsForTracked(
      exercises.map((e) => ({
        ...e,
        personalBest: e.personalBest ?? undefined,
      })),
      profile,
    );
  }, [exercises, profile]);

  const sharePayload = useMemo(() => {
    if (!profile || !progress) return null;
    return {
      displayName: getProfileDisplayName(profile, auth.user),
      progress,
      leagueSummary,
      topByLeague: getTopExerciseByLeague(exercises, profile),
      mostTrained: getMostTrainedExercise(
        exercises,
        performanceEntries ?? [],
      ),
    };
  }, [profile, progress, leagueSummary, exercises, performanceEntries, auth.user]);

  return (
    <ProfileView
      pageTitle={UI.profile}
      data={{
        profile,
        progress,
        exercises,
        performanceEntries: performanceEntries ?? [],
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
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/friends">
              <Users className="mr-2 size-4" />
              {UI.friendsTitle}
            </Link>
          </Button>
        </>
      }
    />
  );
}
