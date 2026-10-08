import { useHomeDaySession } from "@/hooks/use-home-day-session";
import {
  buildRecentVolumeBars,
  formatHomeDayTitle,
} from "@/lib/home-day";
import { hapticImpact } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry } from "@/types";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

type HomeRecapTeaserProps = {
  ownerUserId: string;
  dayKey: string;
  /** Toutes les perfs locales, pour le mini graphique de volume. */
  entries: PerformanceEntry[];
  /** Exercices distincts du jour (affiché si aucun record). */
  exerciseCount: number;
};

const MAX_BAR_HEIGHT_PX = 52;

function headline(records: number, exercises: number): string {
  if (records > 0) {
    return records === 1
      ? UI.homeRecapRecordsOne
      : UI.homeRecapRecords.replace("{count}", String(records));
  }
  return exercises === 1
    ? UI.homeRecapExercisesOne
    : UI.homeRecapExercises.replace("{count}", String(exercises));
}

/** Teaser de récap : mène vers la séance en attendant le vrai récap. */
export function HomeRecapTeaser({
  ownerUserId,
  dayKey,
  entries,
  exerciseCount,
}: HomeRecapTeaserProps) {
  const { data: session } = useHomeDaySession(ownerUserId, dayKey);
  const records = session?.highlights.length ?? 0;
  const exercises = session?.exerciseCount ?? exerciseCount;

  const bars = useMemo(() => {
    const volumes = buildRecentVolumeBars(entries, dayKey);
    const max = Math.max(...volumes, 1);
    return volumes.map((volume) =>
      Math.max(6, Math.round((volume / max) * MAX_BAR_HEIGHT_PX)),
    );
  }, [entries, dayKey]);

  return (
    <Link
      to={`/session/${ownerUserId}/${dayKey}`}
      onClick={() => {
        void hapticImpact();
      }}
      data-analytics-label="home_recap_teaser"
      aria-label={UI.homeRecapAria.replace("{day}", formatHomeDayTitle(dayKey))}
      className="dark flex items-center gap-4 rounded-2xl bg-black p-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="accent-text font-one-more text-[11px] font-bold uppercase italic tracking-wide">
          {UI.homeRecapLabel}
        </span>
        <span className="font-one-more text-lg font-bold uppercase italic leading-tight">
          {headline(records, exercises)}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold">
          {UI.homeRecapCta}
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </span>
      {bars.length > 0 ? (
        <span
          aria-hidden
          className="flex h-[52px] shrink-0 items-end gap-1"
        >
          {bars.map((height, index) => (
            <span
              key={`${index}-${height}`}
              style={{ height }}
              className={cn(
                "w-2 rounded-[3px]",
                index === bars.length - 1 ? "bg-accent" : "bg-white/35",
              )}
            />
          ))}
        </span>
      ) : null}
    </Link>
  );
}
