import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getExerciseImageUrl } from "@/lib/exercisedb";
import { formatPerfLabel } from "@/lib/history-entries";
import { LEAGUE_COLORS } from "@/lib/league-colors";
import type { TopExerciseByLeague } from "@/lib/profile-highlights";
import {
  profileNestedInteractiveClass,
  profileSectionClass,
  profileSectionTitleClass,
} from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const TOP_VISIBLE = 5;

export function ProfileTopExercisesList({
  ranked,
}: {
  ranked: TopExerciseByLeague[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (ranked.length === 0) return null;

  const visible = expanded ? ranked : ranked.slice(0, TOP_VISIBLE);
  const hasMore = ranked.length > TOP_VISIBLE;

  return (
    <section className={profileSectionClass}>
      <h2 className={profileSectionTitleClass}>{UI.profileTopExercisesTitle}</h2>
      <ol className="space-y-2">
        {visible.map((row, index) => {
          const showGif =
            !row.exercise.isCustom && Boolean(row.exercise.gifUrl?.trim());

          return (
          <li key={row.exercise.id}>
            <Link
              to={`/exercise/${row.exercise.id}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 ${profileNestedInteractiveClass}`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-background">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Dumbbell className="size-4 text-muted-foreground" aria-hidden />
                </div>
                {showGif ? (
                  <img
                    src={getExerciseImageUrl(row.exercise.gifUrl)}
                    alt=""
                    className="relative z-10 size-10 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize">
                  {row.exercise.name}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {formatPerfLabel(
                    row.personalBest.weight,
                    row.personalBest.reps,
                  )}
                </p>
              </div>
              <Badge
                className={`shrink-0 text-xs ${LEAGUE_COLORS[row.league.level]}`}
              >
                {row.league.label}
              </Badge>
            </Link>
          </li>
          );
        })}
      </ol>
      {hasMore ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? UI.profileSeeLess
            : UI.profileSeeMore.replace(
                "{count}",
                String(ranked.length - TOP_VISIBLE),
              )}
        </Button>
      ) : null}
    </section>
  );
}
