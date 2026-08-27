import { BodyWeightLabel } from '@/components/BodyWeightLabel'
import { LEAGUE_1RM_STYLES } from '@/lib/league-colors'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'

export type ExercisePerfValue = {
    weight: number
    reps: number
}

function PerfLoad({
    perf,
    repsClassName,
    compact = false,
}: {
    perf: ExercisePerfValue
    repsClassName?: string
    compact?: boolean
}) {
    const weightClass = cn(
        'font-one-more font-bold italic text-foreground',
        compact ? 'text-lg' : 'text-2xl',
    )
    return (
        <span className="flex items-center gap-1">
            <span className={cn('font-bold text-foreground', compact ? 'text-lg' : 'text-2xl')}>
                {perf.weight === 0 ? (
                    <BodyWeightLabel className={weightClass} />
                ) : (
                    <div className={cn('flex items-center', compact ? 'gap-1' : 'gap-2')}>
                        <span className={weightClass}>{perf.weight}</span>
                        <span
                            className={cn(
                                'font-normal text-muted-foreground',
                                compact ? 'text-xs' : 'text-sm',
                            )}
                        >
                            kg
                        </span>
                    </div>
                )}
            </span>
            <span className={cn(compact && 'text-xs', repsClassName)}>× {perf.reps}</span>
        </span>
    )
}

export function ExerciseRecordStat({
    personalBest,
    leagueInfo,
    compact = false,
    className,
}: {
    personalBest?: ExercisePerfValue | null
    leagueInfo?: LeagueInfo | null
    compact?: boolean
    className?: string
}) {
    const isLeagueRecord = Boolean(leagueInfo) && !compact

    return (
        <div
            className={cn(
                'flex flex-col items-start text-sm',
                compact
                    ? 'gap-0.5 rounded-lg bg-secondary px-2.5 py-1.5'
                    : cn(
                          'gap-1 rounded-lg p-3',
                          leagueInfo
                              ? LEAGUE_1RM_STYLES[leagueInfo.tier]
                              : 'border border-accent/70 bg-accent/10 text-foreground',
                      ),
                className,
            )}
        >
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Trophy className={compact ? 'size-3' : 'size-4'} />
                {UI.record}
            </span>
            {personalBest ? (
                <PerfLoad
                    perf={personalBest}
                    compact={compact}
                    repsClassName={
                        compact || isLeagueRecord
                            ? 'text-muted-foreground'
                            : undefined
                    }
                />
            ) : (
                <span className="text-muted-foreground">–</span>
            )}
        </div>
    )
}

export function ExercisePerfStats({
    lastPerf,
    personalBest,
    leagueInfo,
}: {
    lastPerf?: ExercisePerfValue | null
    personalBest?: ExercisePerfValue | null
    leagueInfo?: LeagueInfo | null
}) {
    return (
        <div className="flex gap-4 text-sm">
            <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                <span className="text-muted-foreground">{UI.last}</span>
                {lastPerf ? (
                    <PerfLoad
                        perf={lastPerf}
                        repsClassName="text-muted-foreground"
                    />
                ) : (
                    <span className="text-muted-foreground">–</span>
                )}
            </div>
            <ExerciseRecordStat
                personalBest={personalBest}
                leagueInfo={leagueInfo}
                className="flex-1"
            />
        </div>
    )
}
