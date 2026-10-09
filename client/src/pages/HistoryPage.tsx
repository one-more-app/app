import { BackHeader } from '@/components/BackHeader'
import { HistoryWeekStreak } from '@/components/history/HistoryWeekStreak'
import { SessionFeed } from '@/components/session/SessionFeed'
import { HistoryPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { usePerformanceEntriesData } from '@/hooks/use-api-data'
import { useAuth } from '@/hooks/use-auth'
import { readStoredSession } from '@/lib/auth'
import { UI } from '@/lib/translations'
import { HistoryIcon } from 'lucide-react'
import { useMemo } from 'react'

const MAX_SHOWN = 150

export function HistoryPage() {
    const auth = useAuth()
    const ownerUserId = useMemo(() => {
        if (auth.status === 'authenticated' && auth.user?.id) return auth.user.id
        return readStoredSession()?.user.id
    }, [auth.status, auth.user?.id])
    const { data: allEntries = [], isLoading: isLoadingEntries } =
        usePerformanceEntriesData({ withLeagueInsights: true })
    const entries = useMemo(
        () =>
            allEntries
                .filter((entry) => !entry.deletedAt)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                ),
        [allEntries],
    )

    const shown = useMemo(() => entries.slice(0, MAX_SHOWN), [entries])

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader title={UI.history} />

            <main className="mx-auto max-w-2xl space-y-4 p-4 pb-2">
                {isLoadingEntries ? (
                    <HistoryPageSkeleton />
                ) : (
                    <>
                        <HistoryWeekStreak entries={entries} />
                        {entries.length === 0 ? (
                            <EmptyState
                                icon={HistoryIcon}
                                title={UI.noHistoryEntriesTitle}
                                description={UI.noHistoryEntriesDescription}
                            />
                        ) : ownerUserId ? (
                            <SessionFeed
                                ownerUserId={ownerUserId}
                                entries={shown}
                                recapVariant="compact"
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {UI.sessionUnavailable}
                            </p>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
