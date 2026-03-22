import { BackHeader } from '@/components/BackHeader'
import { BodyMuscleLeagueMap } from '@/components/BodyMuscleLeagueMap'
import { ProfileLeagueSettingsDialog } from '@/components/ProfileLeagueSettingsDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHomeData } from '@/hooks/use-home-data'
import { useTheme } from '@/hooks/use-theme'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import { computeLeagueStatsForTracked } from '@/lib/muscle-league-stats'
import { getUserProfile } from '@/lib/storage'
import { getGlobalLeagueGauge, leagueLevelToFrenchLabel } from '@/lib/strength-standards'
import { translateTarget, UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'
import { BarChart3, ChevronDown, Loader2, Settings } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function StatsPage() {
    const { exercises, hasLoaded } = useHomeData()
    const { resolvedTheme } = useTheme()
    const [profile, setProfile] = useState<UserProfile>(() => getUserProfile())
    const [profileDialogOpen, setProfileDialogOpen] = useState(false)
    const [profileDialogKey, setProfileDialogKey] = useState(0)
    const [openMuscles, setOpenMuscles] = useState<Set<string>>(() => new Set())

    useEffect(() => {
        const onLocal = (e: Event) => {
            const kind = (e as CustomEvent<{ kind?: string }>).detail?.kind
            if (kind === 'profile') setProfile(getUserProfile())
        }
        window.addEventListener('one-more:local-data-changed', onLocal)
        return () => window.removeEventListener('one-more:local-data-changed', onLocal)
    }, [])

    const toggleMuscle = useCallback((target: string) => {
        setOpenMuscles((prev) => {
            const next = new Set(prev)
            if (next.has(target)) next.delete(target)
            else next.add(target)
            return next
        })
    }, [])

    const leagueSummary = useMemo(
        () => computeLeagueStatsForTracked(exercises, profile),
        [exercises, profile],
    )

    const globalGauge = useMemo(() => {
        if (!leagueSummary) return null
        return getGlobalLeagueGauge(leagueSummary.globalAvgLeagueScore)
    }, [leagueSummary])

    if (!hasLoaded) {
        return (
            <div className="min-h-screen bg-background">
                <BackHeader title="Stats" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <BackHeader title="Stats" />

            <main className="mx-auto max-w-2xl space-y-4 p-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="size-5" />
                            Tes ligues par muscle
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => {
                                setProfileDialogKey((k) => k + 1)
                                setProfileDialogOpen(true)
                            }}
                        >
                            <Settings className="size-4" />
                            {UI.settings} — poids, taille, sexe (ligues)
                        </Button>
                        <ProfileLeagueSettingsDialog
                            key={profileDialogKey}
                            open={profileDialogOpen}
                            onOpenChange={setProfileDialogOpen}
                            onSaved={() => setProfile(getUserProfile())}
                        />

                        {!leagueSummary ? (
                            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                <p className="mb-3">
                                    Ajoute des records sur des exercices du catalogue (non personnalisés)
                                    pour voir ta ligue globale et ta carte musculaire.
                                </p>
                                <Button asChild>
                                    <Link to="/home">{UI.chooseExercises}</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                {globalGauge ? (
                                    <div className="rounded-xl border border-border  p-4 text-center">
                                        <p className="text-sm font-medium  tracking-wide">
                                            Ligue globale (tout le corps)
                                        </p>
                                        <div className="mt-3 flex flex-col items-center gap-2">
                                            <Badge
                                                className={`px-3 py-1 text-sm font-semibold ${LEAGUE_COLORS[leagueSummary.globalLevel]}`}
                                            >
                                                {leagueLevelToFrenchLabel(leagueSummary.globalLevel)}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                                Moyenne sur {leagueSummary.exerciseCount} exercice
                                                {leagueSummary.exerciseCount > 1 ? 's' : ''} · score{' '}
                                                {leagueSummary.globalAvgLeagueScore.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="mt-4 w-full border-t border-border pt-4 text-left">
                                            <p className="text-center text-xs font-medium text-foreground">
                                                {UI.statsGlobalGaugeTitle}
                                            </p>
                                            {globalGauge.toLevel ? (
                                                <>
                                                    <div className="mt-2 flex items-center justify-between gap-1">
                                                        <div className="flex min-w-0 flex-1 items-center justify-start gap-1">
                                                            <span className="shrink-0  tabular-nums text-xs text-muted-foreground">
                                                                {globalGauge.segmentStartScore.toFixed(2)}
                                                            </span>
                                                            <Badge
                                                                className={`max-w-[min(100%,8rem)] truncate px-2 py-0 text-[10px] ${LEAGUE_COLORS[globalGauge.fromLevel]}`}
                                                            >
                                                                {leagueLevelToFrenchLabel(globalGauge.fromLevel)}
                                                            </Badge>
                                                        </div>
                                                        <span className="shrink-0 px-0.5 text-xs tabular-nums text-muted-foreground">
                                                            {Math.round(globalGauge.progress * 100)}%
                                                        </span>
                                                        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                                                            {globalGauge.segmentEndScore != null ? (
                                                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                                                    {globalGauge.segmentEndScore.toFixed(2)}
                                                                </span>
                                                            ) : null}
                                                            <Badge
                                                                className={`max-w-[min(100%,8rem)] truncate px-2 py-0 text-[10px] ${LEAGUE_COLORS[globalGauge.toLevel]}`}
                                                            >
                                                                {leagueLevelToFrenchLabel(globalGauge.toLevel)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-[width] duration-300"
                                                            style={{
                                                                width: `${Math.round(globalGauge.progress * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                    <div className="h-full w-full rounded-full bg-primary" />
                                                </div>
                                            )}
                                            <p className="mt-2 text-center text-[10px] leading-snug text-muted-foreground">
                                                {globalGauge.toLevel
                                                    ? UI.statsGlobalGaugeCaption
                                                    : UI.statsGlobalGaugeMax}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <div>
                                    <h2 className="mb-2 text-sm font-medium text-foreground">
                                        Carte musculaire
                                    </h2>
                                    <BodyMuscleLeagueMap
                                        byMuscle={leagueSummary.byMuscle}
                                        isDark={resolvedTheme === 'dark'}
                                        gender={profile.gender}
                                    />
                                </div>

                                <div>
                                    <h2 className="mb-2 text-sm font-medium text-foreground">
                                        Détail par muscle
                                    </h2>
                                    <ul className="divide-y divide-border rounded-lg border border-border">
                                        {leagueSummary.byMuscle.map((m) => {
                                            const open = openMuscles.has(m.target)
                                            return (
                                                <li key={m.target}>
                                                    <button
                                                        type="button"
                                                        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                                                        onClick={() => toggleMuscle(m.target)}
                                                        aria-expanded={open}
                                                    >
                                                        <span className="flex min-w-0 flex-1 items-center gap-2">
                                                            <ChevronDown
                                                                className={cn(
                                                                    'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                                                    open && 'rotate-180',
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
                                                        <ul
                                                            className="space-y-0.5 border-t border-border bg-muted/20 px-2 py-2"
                                                            role="list"
                                                        >
                                                            {m.exercises.map((row) => (
                                                                <li key={row.trackedExerciseId}>
                                                                    <Link
                                                                        to={`/exercise/${row.trackedExerciseId}`}
                                                                        className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
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
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </>
                        )}

                        <Button asChild className="w-full" variant="secondary">
                            <Link to="/home">Mes exercices</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
