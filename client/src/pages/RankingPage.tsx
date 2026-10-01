import { BackHeader } from "@/components/BackHeader";
import { RankingGymGate } from "@/components/ranking/RankingGymGate";
import { RankingGymPlaceBar } from "@/components/ranking/RankingGymPlaceBar";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

function parseTab(value: string | null): RankingTab {
    return value === "friends" ? "friends" : "gym";
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
    const [optOutBusy, setOptOutBusy] = useState(false);
    const [recap, setRecap] = useState<RankingRecapResponse | null>(null);
    const [recapOpen, setRecapOpen] = useState(false);
    const [recapMonth, setRecapMonth] = useState<string | null>(null);
    const recapRequestedRef = useRef<string | null>(null);

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

    const forceRecapParam = searchParams.get("recap");

    // Récap du mois précédent : dès le 1er, ou forcé via ?recap=YYYY-MM (notif).
    useEffect(() => {
        const prevMonth = shiftRankingMonth(getCurrentRankingMonth(), -1);
        const fromNotification = isValidRankingMonth(forceRecapParam);
        const targetMonth =
            fromNotification && forceRecapParam! < currentMonth
                ? forceRecapParam!
                : prevMonth;

        if (recapRequestedRef.current === targetMonth) return;
        if (!fromNotification && hasSeenRankingRecap(targetMonth)) return;
        recapRequestedRef.current = targetMonth;

        if (fromNotification) {
            const params = new URLSearchParams(searchParams);
            params.delete("recap");
            setSearchParams(params, { replace: true });
        }

        let cancelled = false;
        void fetchRankingRecap(targetMonth)
            .then((result) => {
                if (cancelled) return;
                if (result.xp <= 0) {
                    markRankingRecapSeen(targetMonth);
                    return;
                }
                setRecap(result);
                setRecapMonth(targetMonth);
                setRecapOpen(true);
            })
            .catch(() => {
                /* silencieux : le récap est optionnel */
            });
        return () => {
            cancelled = true;
        };
    }, [forceRecapParam, currentMonth, searchParams, setSearchParams]);

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

    const handleOptOut = () => {
        void (async () => {
            setOptOutBusy(true);
            try {
                await setGymRankingOptIn(false);
                await gymSwr.mutate();
            } catch {
                toast.error(UI.rankingGymOptOutError);
            } finally {
                setOptOutBusy(false);
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
            <BackHeader title={UI.rankingTitle} />
            <main className="mx-auto max-w-2xl space-y-4 p-4">
                {data && !gymGate ? <RankingMeHeader me={data.me} /> : null}
                <RankingMonthNav
                    month={month}
                    onChange={(next) => updateParams({ month: next })}
                />
                <RankingTabToggle
                    value={tab}
                    onChange={(next) => updateParams({ tab: next })}
                />
                {tab === "gym" && gymMeta?.hasGym && gymMeta.placeName ? (
                    <RankingGymPlaceBar
                        placeName={gymMeta.placeName}
                        placeAddress={gymMeta.placeAddress}
                        myRank={
                            gymMeta.rankingOptIn ? data?.me.rank : null
                        }
                        total={
                            gymMeta.rankingOptIn
                                ? (data?.total ?? data?.entries.length ?? null)
                                : null
                        }
                        showLeaveRanking={gymMeta.rankingOptIn === true}
                        leaveBusy={optOutBusy}
                        onLeaveRanking={handleOptOut}
                        onGymSaved={async () => {
                            await gymSwr.mutate();
                        }}
                    />
                ) : null}
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
                        <RankingGymGate
                            variant="no-gym"
                            onGymSaved={async () => {
                                await gymSwr.mutate();
                            }}
                        />
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
