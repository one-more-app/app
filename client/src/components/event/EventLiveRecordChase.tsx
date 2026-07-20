import type { EventRecordToBeat } from "@/lib/event-record";
import {
  isLiveBeatingRecord,
  liveRecordProgressPercent,
} from "@/lib/event-record";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

type EventLiveRecordChaseProps = {
  reps: number;
  record: EventRecordToBeat | null;
  size?: "tv" | "admin";
};

export function EventLiveRecordChase({
  reps,
  record,
  size = "tv",
}: EventLiveRecordChaseProps) {
  const isTv = size === "tv";
  const beating = isLiveBeatingRecord(reps, record);
  const progress = liveRecordProgressPercent(reps, record);

  if (beating) {
    return (
      <p
        key="live-new-record"
        className={cn(
          "event-live-rank-rise font-one-more uppercase italic tracking-[0.15em] text-accent motion-reduce:animate-none",
          isTv ? "text-base lg:text-lg" : "text-xs",
        )}
      >
        {UI.eventStandLiveNewRecord}
      </p>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-2",
        isTv ? "max-w-xs lg:max-w-sm" : "max-w-[10rem]",
      )}
    >
      <p
        className={cn(
          "event-live-rank-rise font-one-more uppercase italic tracking-[0.15em] text-muted-foreground motion-reduce:animate-none",
          isTv ? "text-sm lg:text-base" : "text-xs",
        )}
      >
        {UI.eventStandRecordToBeat}
        <span className="mx-2 text-border" aria-hidden>
          ·
        </span>
        <span className="tabular-nums text-foreground">{record.reps}</span>
      </p>

      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary/80",
          isTv ? "h-1" : "h-0.5",
        )}
      >
        <div
          className="h-full rounded-full bg-accent/90 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
