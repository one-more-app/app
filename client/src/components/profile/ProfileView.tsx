import type { ExerciseWithPerf } from "@/hooks/use-home-data";
import { BackHeader } from "@/components/BackHeader";
import { ProfileHighlightsCard } from "@/components/profile/ProfileHighlightsCard";
import { ProfileIdentityHeader } from "@/components/profile/ProfileIdentityHeader";
import { ProfileMuscleMapSection } from "@/components/profile/ProfileMuscleMapSection";
import { ProfileRecentHistory } from "@/components/profile/ProfileRecentHistory";
import { ProfileTopExercisesList } from "@/components/profile/ProfileTopExercisesList";
import { ProfilePageSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { computeLeagueStatsForTracked } from "@/lib/muscle-league-stats";
import { getTopExercisesByLeague } from "@/lib/profile-highlights";
import { UI } from "@/lib/translations";
import type { PerformanceEntry, UserProfile, UserProgressState } from "@/types";
import { Dumbbell } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type ProfileViewData = {
  profile: UserProfile | undefined;
  progress: UserProgressState | undefined;
  exercises: ExerciseWithPerf[];
  performanceEntries: PerformanceEntry[];
  isLoading: boolean;
  error?: boolean;
};

type ProfileViewProps = {
  pageTitle: string;
  data: ProfileViewData;
  readOnly?: boolean;
  headerActions?: ReactNode;
};

export function ProfileView({
  pageTitle,
  data,
  readOnly = false,
  headerActions,
}: ProfileViewProps) {
  const { profile, progress, exercises, performanceEntries, isLoading, error } =
    data;

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

  if (isLoading) {
    return (
      <div className="min-h-screen-app bg-background">
        <BackHeader title={pageTitle} />
        <main className="mx-auto max-w-2xl p-4">
          <ProfilePageSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen-app bg-background">
        <BackHeader title={pageTitle} />
        <main className="mx-auto max-w-2xl p-4">
          <p className="text-sm text-destructive">{UI.friendProfileUnavailable}</p>
        </main>
      </div>
    );
  }

  const hasTracked = exercises.length > 0;

  return (
    <div className="min-h-screen-app bg-background">
      <BackHeader title={pageTitle} />

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <ProfileIdentityHeader
          profile={profile}
          avatarUrl={profile?.avatarUrl}
          readOnly={readOnly}
        />

        {headerActions}

        <ProfileHighlightsCard
          leagueSummary={leagueSummary}
          progress={progress}
          performanceEntries={performanceEntries}
        />

        <ProfileTopExercisesList ranked={topRanked} readOnly={readOnly} />

        <ProfileRecentHistory
          entries={performanceEntries}
          tracked={exercises}
          profile={profile}
          readOnly={readOnly}
        />

        {!hasTracked && !readOnly ? (
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

        {!hasTracked && readOnly ? (
          <EmptyState
            icon={Dumbbell}
            title={UI.profileEmptyTitle}
            description={UI.profileEmptyDescription}
          />
        ) : null}

        {leagueSummary && profile ? (
          <ProfileMuscleMapSection
            leagueSummary={leagueSummary}
            profile={profile}
            readOnly={readOnly}
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
