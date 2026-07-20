import {
  EVENT_RECORD_POP_DELAY_MS,
  EVENT_RECORD_SEGMENT_STAGGER_MS,
  eventRecordFieldEntrance,
  eventRecordRankEntrance,
} from "@/components/event/event-motion";
import { RankBadge } from "@/components/RankBadge";
import type { LeagueInfo } from "@/lib/strength-standards";
import { cn } from "@/lib/utils";
import { forwardRef, type ElementType } from "react";

type EventLeaderRowProps = {
  rank: number;
  displayName: string;
  reps: number;
  league?: LeagueInfo | null;
  highlight?: boolean;
  animateEntrance?: boolean;
  delayMs?: number;
  as?: ElementType;
  className?: string;
  role?: string;
};

export const EventLeaderRow = forwardRef<HTMLElement, EventLeaderRowProps>(
  function EventLeaderRow(
    {
      rank,
      displayName,
      reps,
      league,
      highlight,
      animateEntrance = true,
      delayMs = 0,
      as: Component = "li",
      className,
      role,
    },
    ref,
  ) {
    const rankDelay = delayMs;
    const nameDelay = delayMs + EVENT_RECORD_SEGMENT_STAGGER_MS;
    const repsDelay = delayMs + EVENT_RECORD_SEGMENT_STAGGER_MS * 2;
    const popDelay = repsDelay + EVENT_RECORD_POP_DELAY_MS;

    return (
      <Component
        ref={ref}
        role={role}
        className={cn(
          "flex h-12 shrink-0 items-center gap-3 overflow-hidden rounded-lg px-3",
          highlight && "bg-accent/15 ring-1 ring-accent/40",
          className,
        )}
      >
        <span
          className={
            animateEntrance
              ? eventRecordRankEntrance(
                  "size-8 shrink-0 items-center justify-center rounded-full text-sm font-one-more italic",
                  rank === 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
                )
              : cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-one-more italic",
                  rank === 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
                )
          }
          style={animateEntrance ? { animationDelay: `${rankDelay}ms` } : undefined}
        >
          {rank}
        </span>
        <span
          className={
            animateEntrance
              ? eventRecordFieldEntrance("min-w-0 flex-1 truncate text-base font-medium")
              : "min-w-0 flex-1 truncate text-base font-medium"
          }
          style={animateEntrance ? { animationDelay: `${nameDelay}ms` } : undefined}
        >
          {displayName}
        </span>
        {league ? (
          <RankBadge league={league} size="xs" className="shrink-0" />
        ) : null}
        <span
          className={animateEntrance ? eventRecordFieldEntrance("shrink-0") : "shrink-0"}
          style={animateEntrance ? { animationDelay: `${repsDelay}ms` } : undefined}
        >
          <span
            className={cn(
              "font-one-more text-2xl italic tabular-nums text-accent",
              highlight &&
                animateEntrance &&
                "level-up-count-anim inline-block motion-reduce:animate-none",
            )}
            style={
              highlight && animateEntrance ? { animationDelay: `${popDelay}ms` } : undefined
            }
          >
            {reps}
          </span>
        </span>
      </Component>
    );
  },
);
