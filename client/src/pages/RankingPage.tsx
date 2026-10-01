import { BackHeader } from "@/components/BackHeader";
import { RankingGymGate } from "@/components/ranking/RankingGymGate";
import { RankingList } from "@/components/ranking/RankingList";
import { RankingMeHeader } from "@/components/ranking/RankingMeHeader";
import { RankingMonthNav } from "@/components/ranking/RankingMonthNav";
import { RankingRecapSheet } from "@/components/ranking/RankingRecapSheet";
import { RankingTabToggle } from "@/components/ranking/RankingTabToggle";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { setGymRankingOptIn } from "@/lib/gyms-api";
import {
    fetchFriendsRanking,
    fetchGymRanking,
    fetchRankingRecap,
    type RankingRecapResponse,
    type RankingTab,
} from "@/lib/ranking-api";
import {
    getCurrentRankingMonth,
    isValidRankingMonth,
    shiftRankingMonth,
} from "@/lib/ranking-month";
import {
    hasSeenRankingRecap,
    markRankingRecapSeen,
} from "@/lib/ranking-recap-seen";
import { UI } from "@/lib/translations";
import { Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

function parseTab(value: string | null): RankingTab {
    return value === "gym" ? "gym" : "friends";
}

export default function RankingPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentMonth = getCurrentRankingMonth();
    const tab = parseTab(searchParams.get("tab"));
    const rawMonth = searchParams.get("month");
    const month =
        isValidRankingMonth(rawMonth) && rawMonth <= currentMonth
            ? rawMonth
            : currentMonth;

    const [optInBusy, setOptInBusy] = useState(false);
    const [recap, setRecap] = useState<RankingRecapResponse | null>(null);
    const [recapOpen, setRecapOpen] = useState(false);
    const [recapMonth, setRecapMonth] = useState<string | null>(null);

    const updateParams = useCallback(
        (next: { tab?: RankingTab; month?: string }) => {
            const params = new URLSearchParams(searchParams);
            params.set("tab", next.tab ?? tab);
            params.set("month", next.month ?? month);
            setSearchParams(params, { replace: true });
        },
        [searchParams, setSearchParams, tab, month],
    );

    const friendsSwr = useSWR(
        tab === "friends" ? ["ranking-friends", month] : null,
        ([, m]) => fetchFriendsRanking(m),
    );
    const gymSwr = useSWR(
        tab === "gym" ? ["ranking-gym", month] : null,
        ([, m]) => fetchGymRanking(m),
    );
    const active = tab === "friends" ? friendsSwr : gymSwr;
    const { data, isLoading, error } = active;

    // Récap du mois précédent : une seule fois par mois, à partir du 2 du mois.
    useEffect(() => {
        const now = new Date();
        if (now.getDate() < 2) return;
        const prevMonth = shiftRankingMonth(getCurrentRankingMonth(now), -1);
        if (hasSeenRankingRecap(prevMonth)) return;

        let cancelled = false;
        void fetchRankingRecap(prevMonth)
            .then((result) => {
                if (cancelled) return;
                if (result.xp <= 0) {
                    markRankingRecapSeen(prevMonth);
                    return;
                }
                setRecap(result);
                setRecapMonth(prevMonth);
                setRecapOpen(true);
            })
            .catch(() => {
                /* silencieux : le récap est optionnel */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const dismissRecap = () => {
        if (recapMonth) markRankingRecapSeen(recapMonth);
        setRecapOpen(false);
    };

    const handleOptIn = () => {
        void (async () => {
            setOptInBusy(true);
            try {
                await setGymRankingOptIn(true);
                await gymSwr.mutate();
            } catch {
                toast.error(UI.rankingGymOptInError);
            } finally {
                setOptInBusy(false);
            }
        })();
    };

    const gymMeta = tab === "gym" ? data?.meta : undefined;
    const gymGate =
        tab === "gym" && data
            ? gymMeta?.hasGym === false
                ? "no-gym"
                : gymMeta?.rankingOptIn === false
                  ? "opt-in"
                  : null
            : null;

    return (
        <div className="min-h-screen-app bg-background">
            <header
                data-sticky-app-header
                className="sticky-top-safe z-100 border-b border-border bg-card"
            >
                <BackHeader title={UI.rankingTitle} embedded />
                {data && !gymGate ? (
                    <div className="mx-auto max-w-2xl px-4 pb-3">
                        <RankingMeHeader me={data.me} />
                    </div>
                ) : null}
            </header>
            <main className="mx-auto max-w-2xl space-y-4 p-4">
                <RankingMonthNav
                    month={month}
                    onChange={(next) => updateParams({ month: next })}
                />
                <RankingTabToggle
                    value={tab}
                    onChange={(next) => updateParams({ tab: next })}
                />
                <div
                    role="tabpanel"
                    id={`ranking-panel-${tab}`}
                    aria-labelledby={`ranking-tab-${tab}`}
                >
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : error ? (
                        <EmptyState
                            icon={Trophy}
                            description={UI.rankingLoadError}
                        >
                            <Button
                                variant="secondary"
                                onClick={() => void active.mutate()}
                            >
                                {UI.connectivityRetry}
                            </Button>
                        </EmptyState>
                    ) : gymGate === "no-gym" ? (
                        <RankingGymGate variant="no-gym" />
                    ) : gymGate === "opt-in" ? (
                        <RankingGymGate
                            variant="opt-in"
                            placeName={gymMeta?.placeName}
                            busy={optInBusy}
                            onOptIn={handleOptIn}
                        />
                    ) : data && data.entries.length > 1 ? (
                        <RankingList
                            entries={data.entries}
                            meUserId={data.me.userId}
                        />
                    ) : data ? (
                        <EmptyState
                            icon={Users}
                            description={
                                tab === "friends"
                                    ? UI.rankingEmptyFriends
                                    : UI.rankingEmptyGym
                            }
                        >
                            {tab === "friends" ? (
                                <Button variant="secondary" asChild>
                                    <Link to="/friends/search">
                                        {UI.friendsAddTitle}
                                    </Link>
                                </Button>
                            ) : null}
                        </EmptyState>
                    ) : null}
                </div>
            </main>
            <RankingRecapSheet
                recap={recap}
                open={recapOpen}
                onDismiss={dismissRecap}
            />
        </div>
    );
}
