import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProgressData } from "@/hooks/use-api-data";
import { UI } from "@/lib/translations";
import { Flame, Sparkles } from "lucide-react";

export function UserProgressCard() {
  const { data: progress } = useUserProgressData();
  if (!progress) return null;

  const pct =
    progress.xpForNextLevel > 0
      ? Math.min(
          100,
          Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100),
        )
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden />
          {UI.progressCardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">
            {UI.xpLevelLabel.replace("{level}", String(progress.level))}
          </p>
          {progress.streak.current > 0 ? (
            <p className="flex items-center gap-1 text-sm font-medium text-orange-500">
              <Flame className="size-4" aria-hidden />
              {UI.streakDays.replace("{days}", String(progress.streak.current))}
            </p>
          ) : null}
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {UI.xpTotalLabel.replace("{xp}", String(progress.totalXp))}
        </p>
        {progress.recentGrants.length > 0 ? (
          <ul className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            {progress.recentGrants.map((g, i) => (
              <li key={`${g.sourceType}-${i}`}>
                +{g.amount} XP — {formatGrantSource(g.sourceType)}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatGrantSource(sourceType: string): string {
  switch (sourceType) {
    case "perf":
      return UI.xpSourcePerf;
    case "personal_record":
      return UI.xpSourcePr;
    case "league_promotion":
      return UI.xpSourceLeague;
    case "daily_streak":
      return UI.xpSourceStreak;
    default:
      return sourceType;
  }
}
