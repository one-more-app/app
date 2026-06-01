import { BodyMuscleLeagueMap } from "@/components/BodyMuscleLeagueMap";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { LEAGUE_COLORS } from "@/lib/league-colors";
import type { GlobalLeagueSummary } from "@/lib/muscle-league-stats";
import { leagueLevelToFrenchLabel } from "@/lib/strength-standards";
import {
  profileNestedInteractiveClass,
  profileNestedListClass,
  profileSectionClass,
  profileSectionTitleClass,
} from "@/lib/profile-section";
import { translateTarget, UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

export function ProfileMuscleMapSection({
  leagueSummary,
  profile,
  readOnly = false,
}: {
  leagueSummary: GlobalLeagueSummary;
  profile: UserProfile;
  readOnly?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [openMuscles, setOpenMuscles] = useState<Set<string>>(() => new Set());

  const toggleMuscle = useCallback((target: string) => {
    setOpenMuscles((prev) => {
      const next = new Set(prev);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return next;
    });
  }, []);

  return (
    <section className={profileSectionClass}>
      <h2 className={profileSectionTitleClass}>{UI.profileMuscleMapTitle}</h2>
      <BodyMuscleLeagueMap
        byMuscle={leagueSummary.byMuscle}
        isDark={resolvedTheme === "dark"}
        gender={profile.gender}
        embedded
      />
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-medium text-foreground">
          {UI.profileMuscleDetailTitle}
        </h3>
        <ul className={profileNestedListClass}>
          {leagueSummary.byMuscle.map((m) => {
            const open = openMuscles.has(m.target);
            return (
              <li key={m.target}>
                <button
                  type="button"
                  className={`flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-sm ${profileNestedInteractiveClass}`}
                  onClick={() => toggleMuscle(m.target)}
                  aria-expanded={open}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        open && "rotate-180",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 font-medium">
                      {translateTarget(m.target)}
                    </span>
                  </span>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge
                      className={`text-xs ${LEAGUE_COLORS[m.representativeLevel]}`}
                    >
                      {leagueLevelToFrenchLabel(m.representativeLevel)}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {m.exerciseCount} ex.
                    </span>
                  </div>
                </button>
                {open ? (
                  <ul className="space-y-0.5 bg-background/50 px-2 py-2">
                    {m.exercises.map((row) => (
                      <li key={row.trackedExerciseId}>
                        {readOnly ? (
                          <div className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-2 text-sm">
                            <span className="min-w-0 truncate capitalize">
                              {row.name}
                            </span>
                            <Badge
                              className={`shrink-0 text-xs ${LEAGUE_COLORS[row.league.level]}`}
                            >
                              {row.league.label}
                            </Badge>
                          </div>
                        ) : (
                        <Link
                          to={`/exercise/${row.trackedExerciseId}`}
                          className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-2 text-sm outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="min-w-0 truncate capitalize">
                            {row.name}
                          </span>
                          <Badge
                            className={`shrink-0 text-xs ${LEAGUE_COLORS[row.league.level]}`}
                          >
                            {row.league.label}
                          </Badge>
                        </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
