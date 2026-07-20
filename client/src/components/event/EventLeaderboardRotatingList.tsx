import { EventLeaderRow } from "@/components/event/EventLeaderRow";
import type { EventLeaderboardRow } from "@/lib/event-api";
import { EVENT_LEADERBOARD_ROW_ROTATION_MS } from "@/lib/event-constants";
import type { EventExerciseSlug, EventGenderSlug } from "@/lib/event-constants";
import { getEventLeagueForPerf } from "@/lib/event-league";
import { useEffect, useMemo, useRef, useState } from "react";

const ROW_GAP_PX = 4;

type EventLeaderboardRotatingListProps = {
  rows: EventLeaderboardRow[];
  exercise: EventExerciseSlug;
  gender: EventGenderSlug;
  genderKey: string;
  columnIndex: number;
};

export function EventLeaderboardRotatingList({
  rows,
  exercise,
  gender,
  genderKey,
  columnIndex,
}: EventLeaderboardRotatingListProps) {
  const leader = rows[0] ?? null;
  const rest = rows.slice(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRowRef = useRef<HTMLDivElement>(null);
  const [rowHeightPx, setRowHeightPx] = useState(48);
  const [viewportHeightPx, setViewportHeightPx] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const updateViewport = () => {
      setViewportHeightPx(viewport.clientHeight);
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [rows.length]);

  useEffect(() => {
    const row = measureRowRef.current;
    if (!row) return;
    setRowHeightPx(row.offsetHeight);
  }, [rows, genderKey]);

  const visibleRestCount = useMemo(() => {
    if (viewportHeightPx <= 0) return rest.length;
    const slotHeight = rowHeightPx + ROW_GAP_PX;
    return Math.max(1, Math.floor((viewportHeightPx + ROW_GAP_PX) / slotHeight));
  }, [rest.length, rowHeightPx, viewportHeightPx]);

  const needsTicker = rest.length > visibleRestCount && !reduceMotion;
  const tickerDurationMs = rest.length * EVENT_LEADERBOARD_ROW_ROTATION_MS;
  const staticRest = useMemo(
    () => (reduceMotion ? rest.slice(0, visibleRestCount) : rest),
    [reduceMotion, rest, visibleRestCount],
  );

  if (!leader) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <ol className="shrink-0">
        <EventLeaderRow
          key={`${genderKey}-leader-${leader.id}`}
          rank={leader.rank}
          displayName={leader.displayName}
          reps={leader.reps}
          league={getEventLeagueForPerf(exercise, gender, leader.reps)}
          highlight
          delayMs={0}
        />
      </ol>

      <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={measureRowRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 -z-10 w-full opacity-0"
        >
          {rest[0] ? (
            <EventLeaderRow
              as="div"
              rank={rest[0].rank}
              displayName={rest[0].displayName}
              reps={rest[0].reps}
              league={getEventLeagueForPerf(exercise, gender, rest[0].reps)}
              animateEntrance={false}
            />
          ) : null}
        </div>

        {needsTicker ? (
          <div
            key={`${genderKey}-ticker`}
            className="event-leaderboard-ticker flex flex-col gap-1 motion-reduce:animate-none"
            style={{
              animationDuration: `${tickerDurationMs}ms`,
              animationDelay: `${columnIndex * 200}ms`,
            }}
            role="list"
            aria-live="off"
          >
            {[...rest, ...rest].map((row, index) => (
              <EventLeaderRow
                key={`${genderKey}-ticker-${row.id}-${index}`}
                as="div"
                role="listitem"
                rank={row.rank}
                displayName={row.displayName}
                reps={row.reps}
                league={getEventLeagueForPerf(exercise, gender, row.reps)}
                animateEntrance={false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1" role="list">
            {staticRest.map((row) => (
              <EventLeaderRow
                key={`${genderKey}-${row.id}`}
                as="div"
                role="listitem"
                rank={row.rank}
                displayName={row.displayName}
                reps={row.reps}
                league={getEventLeagueForPerf(exercise, gender, row.reps)}
                animateEntrance={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
