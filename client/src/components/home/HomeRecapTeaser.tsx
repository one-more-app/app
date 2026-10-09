import { useHomeSessionById } from "@/hooks/use-day-sessions";
import {
  buildRecentVolumeBars,
  formatHomeDayTitle,
} from "@/lib/home-day";
import { hapticImpact } from "@/lib/haptics";
import { sessionPath } from "@/lib/session-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry } from "@/types";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

type HomeRecapTeaserProps = {
  ownerUserId: string;
  dayKey: string;
  /** Séance first-class (lien + highlights scoppés). */
  sessionId?: string;
  /** Toutes les perfs locales, pour le mini graphique de volume. */
  entries: PerformanceEntry[];
  /** Exercices distincts (affiché si aucun record). */
  exerciseCount: number;
  variant?: "default" | "compact";
};

const MAX_BAR_HEIGHT_PX = 52;
const MAX_BAR_HEIGHT_COMPACT_PX = 32;
const RECAP_HERO_SRC = "/images/first-session-hero.jpg";

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

/** Teaser de récap : mène vers la séance (by id si connu). */
export function HomeRecapTeaser({
  ownerUserId,
  dayKey,
  sessionId,
  entries,
  exerciseCount,
  variant = "default",
}: HomeRecapTeaserProps) {
  const compact = variant === "compact";
  const maxBar = compact ? MAX_BAR_HEIGHT_COMPACT_PX : MAX_BAR_HEIGHT_PX;
  const minBar = compact ? 4 : 6;

  const { data: session } = useHomeSessionById(sessionId);
  const records = session?.highlights.length ?? 0;
  const exercises = session?.exerciseCount ?? exerciseCount;

  const bars = useMemo(() => {
    const volumes = buildRecentVolumeBars(entries, dayKey);
    const max = Math.max(...volumes, 1);
    return volumes.map((volume) =>
      Math.max(minBar, Math.round((volume / max) * maxBar)),
    );
  }, [entries, dayKey, maxBar, minBar]);

  const to = sessionId
    ? sessionPath(sessionId)
    : session?.id
      ? sessionPath(session.id)
      : `/session/${ownerUserId}/${dayKey}`;

  return (
    <Link
      to={to}
      onClick={() => {
        void hapticImpact();
      }}
      data-analytics-label="home_recap_teaser"
      aria-label={UI.homeRecapAria.replace("{day}", formatHomeDayTitle(dayKey))}
      className={cn(
        "dark relative flex items-center overflow-hidden rounded-2xl bg-[#0a0a0a] text-white outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "min-h-[72px] gap-3 p-3" : "min-h-[112px] gap-4 p-4",
      )}
    >
      <img
        src={RECAP_HERO_SRC}
        alt=""
        className="absolute inset-0 size-full select-none object-cover object-[50%_35%] opacity-50"
        draggable={false}
        loading="lazy"
        decoding="async"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40"
      />
      <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-2">
        <span
          className={cn(
            "accent-text font-one-more font-bold uppercase italic tracking-wide",
            compact ? "text-[10px]" : "text-[11px]",
          )}
        >
          {UI.homeRecapLabel}
        </span>
        <span
          className={cn(
            "font-one-more font-bold uppercase italic leading-tight",
            compact ? "text-base" : "text-lg",
          )}
        >
          {headline(records, exercises)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {UI.homeRecapCta}
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </span>
      {bars.length > 0 ? (
        <span
          aria-hidden
          className={cn(
            "relative z-10 flex shrink-0 items-end gap-1",
            compact ? "h-[32px]" : "h-[52px]",
          )}
        >
          {bars.map((height, index) => (
            <span
              key={`${index}-${height}`}
              style={{ height }}
              className={cn(
                "rounded-[3px]",
                compact ? "w-1.5" : "w-2",
                index === bars.length - 1 ? "bg-accent" : "bg-white/35",
              )}
            />
          ))}
        </span>
      ) : null}
    </Link>
  );
}
