import { Badge } from '@/components/ui/badge'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import { Trophy } from 'lucide-react'

const NEXT_TIER: Record<string, { label: string; level: string } | null> = {
    iron: { label: 'Bronze', level: 'bronze' },
    bronze: { label: 'Argent', level: 'silver' },
    silver: { label: 'Or', level: 'gold' },
    gold: { label: 'Platine', level: 'platinum' },
    platinum: { label: 'Émeraude', level: 'emerald' },
    emerald: { label: 'Diamant', level: 'diamond' },
    diamond: { label: 'Maître', level: 'master' },
    master: { label: 'Elite', level: 'elite' },
    elite: { label: 'Légende', level: 'legend' },
    legend: null,
}

const LEAGUE_1RM_STYLES: Record<string, string> = {
    iron: 'border border-zinc-500/80 bg-zinc-700/20',
    bronze: 'border border-amber-700/80 bg-amber-900/20',
    silver: 'border border-slate-500/80 bg-slate-600/20',
    gold: 'border border-amber-500/80 bg-amber-600/20',
    platinum: 'border border-cyan-600/80 bg-cyan-800/20',
    emerald: 'border border-emerald-600/80 bg-emerald-800/20',
    diamond: 'border border-violet-500/80 bg-violet-600/20',
    master: 'border border-rose-600/80 bg-rose-800/20',
    elite: 'border border-emerald-500/80 bg-emerald-700/20',
    legend: 'border border-amber-400/80 bg-amber-500/20',
}

interface LeagueBadgeProps {
    league: LeagueInfo
    /** Afficher le palier suivant (poids à atteindre) */
    showNextTarget?: boolean
    /** Version compacte (badge seul) ou détaillée */
    compact?: boolean
    /** Suffixe pour les poids (ex: " kg" ou " kg (par haltère)") */
    weightSuffix?: string
}

const DEFAULT_WEIGHT_SUFFIX = ' kg'

export function LeagueBadge({
    league,
    showNextTarget = false,
    compact = false,
    weightSuffix = DEFAULT_WEIGHT_SUFFIX,
}: LeagueBadgeProps) {
    const colorClass = LEAGUE_COLORS[league.level] ?? 'bg-muted text-muted-foreground'
    const oneRMStyle = LEAGUE_1RM_STYLES[league.level] ?? 'border border-muted bg-muted/20'

    if (compact) {
        return (
            <Badge variant="outline" className={`shrink-0 ${colorClass}`}>
                <Trophy className="mr-1 size-3" />
                {league.label}
            </Badge>
        )
    }

    const remainingKg =
        league.progressToNext < 1
            ? Math.max(0, league.weightToReach - league.oneRM).toFixed(1)
            : null

    return (
        <div className="rounded-lg space-y-4">
            <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={colorClass}>
                    <Trophy className="mr-1 size-3" />
                    {league.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                    {UI.percentileDescription.replace('{p}', String(league.percentileEstimate))}
                </span>
            </div>

            <div className={`rounded-lg p-3 ${oneRMStyle}`}>
                <span className="text-sm text-muted-foreground">{UI.your1RM}</span>
                <div className="flex items-center gap-2">
                    <span className="block text-2xl font-bold italic text-primary">
                        {league.oneRM.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">{weightSuffix}</span>
                </div>
            </div>

            {showNextTarget && league.progressToNext < 1 && (
                <div className="space-y-3">
                    {remainingKg && Number(remainingKg) > 0 && NEXT_TIER[league.level] && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-primary flex-wrap">
                            {UI.remainingForNext.replace('{kg}', remainingKg)}
                            <Badge
                                variant="outline"
                                className={`shrink-0 text-[10px] py-0 ${LEAGUE_COLORS[NEXT_TIER[league.level]!.level] ?? 'bg-muted'
                                    }`}
                            >
                                {NEXT_TIER[league.level]!.label}
                            </Badge>
                        </p>
                    )}
                    <div className="flex justify-between items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            {league.weightTierStart.toFixed(1)}{weightSuffix}
                            <Badge variant="outline" className={`shrink-0 text-[10px] py-0 ${colorClass}`}>
                                {league.label}
                            </Badge>
                        </span>
                        <span className="flex items-center gap-1.5">
                            {league.weightTierEnd != null ? (
                                <>
                                    {league.weightTierEnd.toFixed(1)}{weightSuffix}
                                    {NEXT_TIER[league.level] && (
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-[10px] py-0 ${LEAGUE_COLORS[NEXT_TIER[league.level]!.level] ?? 'bg-muted'
                                                }`}
                                        >
                                            {NEXT_TIER[league.level]!.label}
                                        </Badge>
                                    )}
                                </>
                            ) : (
                                '—'
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${league.progressToNext * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
