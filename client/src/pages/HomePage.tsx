import { HomeDayContent } from '@/components/home/HomeDayContent'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeProgressWeekCard } from '@/components/home/HomeProgressWeekCard'
import { HomeStartSessionCta } from '@/components/home/HomeStartSessionCta'
import { HomeTour } from '@/components/HomeTour'
import { ExerciseCardSkeletonList } from '@/components/skeletons'
import {
    usePerformanceEntriesData,
    useTrackedExercisesData,
    useUserProgressData,
} from '@/hooks/use-api-data'
import { useAuth } from '@/hooks/use-auth'
import { useDaySessions } from '@/hooks/use-day-sessions'
import { useLocalPerformanceEntries } from '@/hooks/use-local-data-store'
import { useSessionTiming } from '@/hooks/use-session-timing'
import {
    buildWeekCells,
    getWeekStartDateKey,
    shiftWeekStartDateKey,
} from '@/lib/activity-calendar'
import {
    collectActiveDayKeysFromEntries,
    getActivityDayKey,
    mergePerformanceEntriesById,
} from '@/lib/activity-from-performances'
import { requestAdsTrackingWhenAppActive } from '@/lib/ads-tracking'
import { readStoredSession } from '@/lib/auth'
import {
    classifyHomeDay,
    findLastSessionDay,
    resolveHomeStreak,
    resolveLastActiveDate,
} from '@/lib/home-day'
import { getLocalDateKey } from '@/lib/local-date'
import { resolveStreakXpBonus } from '@/lib/streak-xp-display'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
    const auth = useAuth()
    const { data: progress } = useUserProgressData()
    const { data: remoteEntries, isLoading: remoteEntriesLoading } =
        usePerformanceEntriesData()
    const { data: trackedExercises, isLoading: trackedLoading } =
        useTrackedExercisesData()
    const localEntries = useLocalPerformanceEntries()
    const navigate = useNavigate()

    const ownerUserId = useMemo(() => {
        if (auth.status === 'authenticated' && auth.user?.id) return auth.user.id
        return readStoredSession()?.user.id
    }, [auth.status, auth.user?.id])

    const todayKey = getLocalDateKey()

    useEffect(() => {
        void requestAdsTrackingWhenAppActive()
    }, [])

    const entries = useMemo(
        () =>
            mergePerformanceEntriesById(remoteEntries ?? [], localEntries).filter(
                (entry) => !entry.deletedAt,
            ),
        [remoteEntries, localEntries],
    )
    const isLoading = remoteEntriesLoading && entries.length === 0

    // Nouvel inscrit : ni perf ni exercice suivi (une fois les données chargées).
    const isNewUser =
        !isLoading &&
        !trackedLoading &&
        entries.length === 0 &&
        !(trackedExercises ?? []).some((exercise) => !exercise.deletedAt)

    const activeDays = useMemo(
        () => collectActiveDayKeysFromEntries(entries),
        [entries],
    )

    const todayEntries = useMemo(
        () => entries.filter((entry) => getActivityDayKey(entry) === todayKey),
        [entries, todayKey],
    )
    const { data: todayDaySessions } = useDaySessions(
        ownerUserId,
        todayKey,
        todayEntries.length > 0,
    )
    const todayLive = todayDaySessions?.items.find((item) => item.isLive)
    const todayEndedAt =
        todayLive == null
            ? (todayDaySessions?.items[todayDaySessions.items.length - 1]
                ?.endedAt ?? null)
            : null
    const { timing: todayTiming } = useSessionTiming(todayEntries, {
        dayKey: todayKey,
        endedAt: todayEndedAt,
    })
    // Source de vérité : liste séances du jour. Fallback idle local si pas encore chargé.
    const hasLiveSession =
        todayDaySessions != null
            ? todayLive != null
            : todayTiming?.isInProgress === true

    // Jour J tant que l'utilisateur n'a pas choisi un autre jour.
    const [pickedDay, setPickedDay] = useState<string | null>(null)
    const [weekStartOverride, setWeekStartOverride] = useState<string | null>(null)

    const selectedDay = pickedDay ?? todayKey
    const weekStart = weekStartOverride ?? getWeekStartDateKey(selectedDay)
    const currentWeekStart = getWeekStartDateKey(todayKey)

    const weekCells = buildWeekCells(activeDays, weekStart, todayKey)

    const earliestWeekStart = useMemo(
        () => getWeekStartDateKey(activeDays[0] ?? todayKey),
        [activeDays, todayKey],
    )
    const canGoPrev = weekStart > earliestWeekStart
    const canGoNext = weekStart < shiftWeekStartDateKey(currentWeekStart, 1)

    const handleSelectDay = useCallback((dayKey: string) => {
        setPickedDay(dayKey)
    }, [])

    const handleJumpToDay = useCallback((dayKey: string) => {
        setPickedDay(dayKey)
        setWeekStartOverride(null)
    }, [])

    const handleShiftWeek = useCallback(
        (delta: number) => {
            const nextWeekStart = shiftWeekStartDateKey(weekStart, delta)
            const cells = buildWeekCells(activeDays, nextWeekStart, todayKey)
            const todayCell = cells.find((cell) => cell.isToday)
            const lastActive = [...cells].reverse().find((cell) => cell.active)
            setWeekStartOverride(nextWeekStart)
            setPickedDay((todayCell ?? lastActive ?? cells[0]).date)
        },
        [weekStart, activeDays, todayKey],
    )

    const dayKind = classifyHomeDay({
        dayKey: selectedDay,
        todayKey,
        activeDays,
        hasLiveSession,
    })

    const dayEntries = useMemo(
        () => entries.filter((entry) => getActivityDayKey(entry) === selectedDay),
        [entries, selectedDay],
    )

    const lastSessionDay = useMemo(
        () => findLastSessionDay(activeDays, todayKey),
        [activeDays, todayKey],
    )

    const streakCurrent = progress?.streak.current ?? 0
    const serverLastActiveDate = progress?.lastActiveDate
    const streak = useMemo(
        () =>
            resolveHomeStreak({
                streakCurrent,
                lastActiveDate: resolveLastActiveDate(
                    serverLastActiveDate,
                    activeDays,
                    todayKey,
                ),
                todayKey,
            }),
        [streakCurrent, serverLastActiveDate, activeDays, todayKey],
    )
    const bonusPercent = progress ? resolveStreakXpBonus(progress).bonusPercent : 0

    // Limite atteinte : bloquer l'ajout, pas le démarrage (exercices déjà suivis OK).
    const goToStartSession = useCallback(() => {
        navigate('/exercises')
    }, [navigate])

    const goToAddExercise = useCallback(() => {
        navigate('/exercises')
    }, [navigate])

    const showStartCta = !isLoading && !hasLiveSession

    return (
        <div className="min-h-screen-app bg-background">
            <main
                className={cn(
                    'mx-auto max-w-2xl p-4 pt-safe-top',
                    showStartCta && 'pb-28',
                )}
            >
                <HomeHeader ownerUserId={ownerUserId} />

                {progress ? (
                    <HomeProgressWeekCard
                        progress={progress}
                        streak={streak}
                        bonusPercent={bonusPercent}
                        weekCells={weekCells}
                        selectedDay={selectedDay}
                        onSelectDay={handleSelectDay}
                        onPrevWeek={() => handleShiftWeek(-1)}
                        onNextWeek={() => handleShiftWeek(1)}
                        canGoPrev={canGoPrev}
                        canGoNext={canGoNext}
                        hasLiveSession={hasLiveSession}
                    />
                ) : null}

                {isLoading ? (
                    <ExerciseCardSkeletonList count={3} compact />
                ) : (
                    <HomeDayContent
                        kind={dayKind}
                        dayKey={selectedDay}
                        ownerUserId={ownerUserId}
                        entries={entries}
                        dayEntries={dayEntries}
                        lastSessionDay={lastSessionDay}
                        onSelectDay={handleJumpToDay}
                        onAddExercise={goToAddExercise}
                        isNewUser={isNewUser}
                    />
                )}
            </main>

            {showStartCta ? <HomeStartSessionCta onClick={goToStartSession} /> : null}

            <HomeTour
                pageReady={!isLoading}
                progressReady={progress != null}
                hasLiveSession={hasLiveSession && dayKind === 'live'}
                hasStartCta={showStartCta}
            />
        </div>
    )
}

export default HomePage
