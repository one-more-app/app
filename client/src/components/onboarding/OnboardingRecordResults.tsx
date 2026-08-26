import { RankBadge } from "@/components/RankBadge"
import type { OneRmPercentRow } from "@/lib/onboarding-1rm-table"
import type { LeagueInfo } from "@/lib/strength-standards"
import { UI } from "@/lib/translations"

export function OnboardingOneRmTable({
  oneRM,
  rows,
}: {
  oneRM: number
  rows: OneRmPercentRow[]
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
        <span className="text-sm text-muted-foreground">{UI.your1RM}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-one-more block text-2xl font-bold italic text-foreground">
            {oneRM.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">kg</span>
        </div>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.percent}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">
              {row.reps === 1
                ? UI.onboardingOneRmPercentRowOne
                    .replace("{percent}", String(row.percent))
                    .replace("{kg}", row.weightKg.toFixed(1))
                : UI.onboardingOneRmPercentRow
                    .replace("{percent}", String(row.percent))
                    .replace("{kg}", row.weightKg.toFixed(1))
                    .replace("{reps}", String(row.reps))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OnboardingRankReveal({ league }: { league: LeagueInfo }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <RankBadge league={league} size="xl" />
        <p className="text-base font-medium text-foreground">
          {UI.onboardingRankStart.replace("{rank}", league.label)}
        </p>
        <p className="text-sm text-muted-foreground">
          {UI.percentileDescription.replace(
            "{p}",
            String(league.percentileEstimate),
          )}
        </p>
      </div>
      <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
        <span className="text-sm text-muted-foreground">{UI.your1RM}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-one-more block text-2xl font-bold italic text-foreground">
            {league.oneRM.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">kg</span>
        </div>
      </div>
    </div>
  )
}
