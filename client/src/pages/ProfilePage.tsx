import { BackHeader } from "@/components/BackHeader";
import { ProfileActivitySection } from "@/components/profile/ProfileActivitySection";
import { ProfileHighlightsCard } from "@/components/profile/ProfileHighlightsCard";
import { ProfileIdentityHeader } from "@/components/profile/ProfileIdentityHeader";
import { ProfileMuscleMapSection } from "@/components/profile/ProfileMuscleMapSection";
import { ProfileRecentHistory } from "@/components/profile/ProfileRecentHistory";
import { ProfileTopExercisesList } from "@/components/profile/ProfileTopExercisesList";
import { ProfilePageSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useHomeData } from "@/hooks/use-home-data";
import { computeLeagueStatsForTracked } from "@/lib/muscle-league-stats";
import { getTopExercisesByLeague } from "@/lib/profile-highlights";
import { UI } from "@/lib/translations";
import { Dumbbell } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { exercises, hasLoaded } = useHomeData();
  const { data: profile } = useUserProfileData();

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

  const topRanked = useMemo(() => {
    if (!profile) return [];
    return getTopExercisesByLeague(exercises, profile);
  }, [exercises, profile]);

  if (!hasLoaded) {
    return (
      <div className="min-h-screen-app bg-background">
        <BackHeader title={UI.profile} />
        <main className="mx-auto max-w-2xl p-4">
          <ProfilePageSkeleton />
        </main>
      </div>
    );
  }

  const hasTracked = exercises.length > 0;

  return (
    <div className="min-h-screen-app bg-background">
      <BackHeader title={UI.profile} />

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <ProfileIdentityHeader />

        <ProfileActivitySection />

        <ProfileHighlightsCard leagueSummary={leagueSummary} />

        <ProfileTopExercisesList ranked={topRanked} />

        <ProfileRecentHistory />

        {!hasTracked ? (
          <EmptyState
            icon={Dumbbell}
            title={UI.profileEmptyTitle}
            description={UI.profileEmptyDescription}
          >
            <Button asChild size="sm">
              <Link to="/exercises">{UI.addExercise}</Link>
            </Button>
          </EmptyState>
        ) : null}

        {leagueSummary && profile ? (
          <ProfileMuscleMapSection
            leagueSummary={leagueSummary}
            profile={profile}
          />
        ) : hasTracked ? (
          <p className="text-center text-sm text-muted-foreground">
            {UI.profileEmptyLeagues}
          </p>
        ) : null}
      </main>
    </div>
  );
}
