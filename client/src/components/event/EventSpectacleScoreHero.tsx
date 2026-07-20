import { RankBadge } from "@/components/RankBadge";
import type { LeagueInfo } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EventSpectacleScoreHeroProps = {
  reps: number;
  league: LeagueInfo | null;
  size?: "tv" | "admin";
  rank?: number;
  footer?: ReactNode;
  animationKey?: string;
  className?: string;
};

function leagueKey(league: LeagueInfo | null): string {
  if (!league) return "none";
  return `${league.tier}-${league.subRank ?? "max"}`;
}

export function EventSpectacleScoreHero({
  reps,
  league,
  size = "tv",
  rank,
  footer,
  animationKey,
  className,
}: EventSpectacleScoreHeroProps) {
  const isTv = size === "tv";
  const heroKey = animationKey ?? String(reps);
  const rankLabel =
    rank != null
      ? UI.eventStandAttemptResultRank.replace("{rank}", String(rank))
      : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isTv ? "gap-5 lg:gap-8" : "gap-3",
        className,
      )}
    >
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
              key={`glow-${heroKey}`}
              className="event-live-count-glow pointer-events-none absolute -inset-[0.14em] translate-x-[0.12em] rounded-full bg-accent/25 motion-reduce:animate-none"
              aria-hidden
            />
          ) : null}

          <p
            key={heroKey}
            className="event-live-count-bump relative z-[1] font-one-more font-bold italic tabular-nums leading-none text-accent motion-reduce:animate-none"
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
        {UI.reps}
      </p>

      {rankLabel ? (
        <p
          key={`rank-${heroKey}`}
          className={cn(
            "event-live-rank-rise font-one-more uppercase italic text-foreground motion-reduce:animate-none",
            isTv ? "text-3xl lg:text-4xl" : "text-xl",
          )}
        >
          {rankLabel}
        </p>
      ) : null}

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
        ) : null}
      </div>

      {footer ? (
        <div
          key={`footer-${heroKey}`}
          className="event-live-rank-rise max-w-2xl motion-reduce:animate-none"
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
