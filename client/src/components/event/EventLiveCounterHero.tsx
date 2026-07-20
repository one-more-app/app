import { EventLiveRecordChase } from "@/components/event/EventLiveRecordChase";
import { RankBadge } from "@/components/RankBadge";
import type { EventRecordToBeat } from "@/lib/event-record";
import type { LeagueInfo } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

type EventLiveCounterHeroProps = {
    reps: number;
    league: LeagueInfo | null;
    recordToBeat?: EventRecordToBeat | null;
    size?: "tv" | "admin";
    className?: string;
};

function leagueKey(league: LeagueInfo | null): string {
    if (!league) return "none";
    return `${league.tier}-${league.subRank ?? "max"}`;
}

export function EventLiveCounterHero({
    reps,
    league,
    recordToBeat = null,
    size = "tv",
    className,
}: EventLiveCounterHeroProps) {
    const isTv = size === "tv";

    return (
        <div
            className={cn(
                "flex w-full flex-col items-center justify-center text-center",
                isTv ? "gap-8 lg:gap-10" : "gap-4",
                className,
            )}
        >
            <EventLiveRecordChase reps={reps} record={recordToBeat} size={size} />

            <div
                className={cn(
                    "flex items-center justify-center",
                    isTv ? "min-h-[clamp(8rem,22vw,16rem)] min-w-[clamp(8rem,22vw,16rem)]" : "min-h-24 min-w-24",
                )}
            >
                <div
                    className={cn(
                        "relative inline-flex items-center justify-center",
                        isTv ? "text-[clamp(5.5rem,20vw,13rem)]" : "text-6xl",
                    )}
                >
                    {isTv ? (
                        <div
                            key={`glow-${reps}`}
                            className="event-live-count-glow pointer-events-none absolute -inset-[0.14em] translate-x-[0.11em] rounded-full bg-accent/25 motion-reduce:animate-none"
                            aria-hidden
                        />
                    ) : null}

                    <p
                        key={reps}
                        className={cn(
                            "event-live-count-bump relative z-[1] font-one-more font-bold italic tabular-nums leading-none text-accent motion-reduce:animate-none",
                        )}
                    >
                        {reps}
                    </p>
                </div>
            </div>

            <p
                className={cn(
                    "font-one-more uppercase italic tracking-[0.35em] text-muted-foreground",
                    isTv ? "text-base lg:text-xl" : "text-xs tracking-[0.25em]",
                )}
            >
                {UI.eventStandLiveAttemptReps}
            </p>

            <div
                className={cn(
                    "flex min-h-[2.75rem] items-center justify-center",
                    isTv ? "min-h-[3.5rem] lg:min-h-[4rem]" : "min-h-8",
                )}
            >
                {league ? (
                    <div
                        key={leagueKey(league)}
                        className="event-live-rank-rise motion-reduce:animate-none"
                    >
                        <RankBadge league={league} size={isTv ? "xl" : "lg"} />
                    </div>
                ) : (
                    <span
                        className={cn(
                            "font-one-more uppercase italic text-muted-foreground/50",
                            isTv ? "text-lg lg:text-xl" : "text-sm",
                        )}
                        aria-hidden
                    >
                        –
                    </span>
                )}
            </div>
        </div>
    );
}
