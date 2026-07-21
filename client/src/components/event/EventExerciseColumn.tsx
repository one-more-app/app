import {
  EVENT_COLUMN_STAGGER_MS,
  EVENT_RECORD_SEGMENT_STAGGER_MS,
  eventCardEntrance,
  eventChipEntrance,
  eventRecordFieldEntrance,
} from "@/components/event/event-motion";
import { EventLeaderboardRotatingList } from "@/components/event/EventLeaderboardRotatingList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventLeaderboardRow } from "@/lib/event-api";
import { EVENT_EXERCISE_META, type EventExerciseSlug, type EventGenderSlug } from "@/lib/event-constants";
import { UI } from "@/lib/translations";

export function EventExerciseColumn({
  exercise,
  rows,
  gender,
  genderKey,
  gifUrl,
  columnIndex = 0,
}: {
  exercise: EventExerciseSlug;
  rows: EventLeaderboardRow[];
  gender: EventGenderSlug;
  genderKey: string;
  gifUrl?: string | null;
  columnIndex?: number;
}) {
  const meta = EVENT_EXERCISE_META[exercise];
  const title = UI[meta.labelKey];

  return (
    <Card
      className={eventCardEntrance("flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0")}
      style={{ animationDelay: `${columnIndex * EVENT_COLUMN_STAGGER_MS}ms` }}
    >
      <CardHeader className="flex shrink-0 flex-row items-center gap-3 border-b border-border/40 pt-3 !pb-3">
        {gifUrl ? (
          <img
            src={gifUrl}
            alt=""
            className={eventChipEntrance(
              "size-12 rounded-lg object-contain p-1 opacity-90 brightness-0 invert",
            )}
            style={{ animationDelay: `${columnIndex * EVENT_COLUMN_STAGGER_MS}ms` }}
          />
        ) : (
          <div className="size-12 shrink-0 rounded-lg bg-secondary/80" aria-hidden />
        )}
        <CardTitle
          className={eventRecordFieldEntrance("text-xl tracking-wide")}
          style={{
            animationDelay: `${columnIndex * EVENT_COLUMN_STAGGER_MS + EVENT_RECORD_SEGMENT_STAGGER_MS}ms`,
          }}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3 pb-3">
        {rows.length === 0 ? (
          <div
            className={eventCardEntrance(
              "flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground",
            )}
          >
            {UI.eventStandEmpty}
          </div>
        ) : (
          <EventLeaderboardRotatingList
            rows={rows}
            exercise={exercise}
            gender={gender}
            genderKey={genderKey}
            columnIndex={columnIndex}
          />
        )}
      </CardContent>
    </Card>
  );
}
