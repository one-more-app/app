import { Card, CardContent } from "@/components/ui/card";
import type { VolumeSessionBar } from "@/lib/home-day";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

const MAX_BAR_HEIGHT_PX = 72;
const MIN_BAR_HEIGHT_PX = 16;

export function formatRecapNumber(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

/** « 1 sept » : jour + mois court, sans le point final. */
function formatBarDay(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00`)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    .replace(/\.$/, "");
}

/** Heure locale courte pour distinguer deux séances le même jour. */
function formatBarTime(startedAt: string): string {
  return new Date(startedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function barLabel(
  bar: VolumeSessionBar,
  dayCounts: Map<string, number>,
): string {
  if ((dayCounts.get(bar.dayKey) ?? 0) > 1) {
    return formatBarTime(bar.startedAt);
  }
  return formatBarDay(bar.dayKey);
}

type RecapStat = { label: string; value: string };

type RecapVolumeCardProps = {
  totalVolume: number;
  /** Du plus ancien au plus récent ; la dernière barre est la séance affichée. */
  bars: VolumeSessionBar[];
  stats: RecapStat[];
};

/** Carte "Volume soulevé" du récap (captures 40 et 41). */
export function RecapVolumeCard({
  totalVolume,
  bars,
  stats,
}: RecapVolumeCardProps) {
  const max = Math.max(...bars.map((bar) => bar.volume), 1);
  const lastIndex = bars.length - 1;
  const dayCounts = new Map<string, number>();
  for (const bar of bars) {
    dayCounts.set(bar.dayKey, (dayCounts.get(bar.dayKey) ?? 0) + 1);
  }

  return (
    <Card className="py-0">
      <CardContent className="space-y-3 p-3">
        <h2 className="font-one-more text-xs font-bold uppercase italic">
          {UI.recapVolumeTitle}
        </h2>
        <p className="flex items-baseline gap-1.5">
          <span className="font-one-more text-3xl font-bold italic leading-none tabular-nums">
            {formatRecapNumber(totalVolume)}
          </span>
          <span className="text-xs text-muted-foreground">
            {UI.recapVolumeUnit}
          </span>
        </p>

        <p className="text-xs text-muted-foreground">
          {bars.length > 1
            ? UI.recapLastSessions.replace("{count}", String(bars.length))
            : UI.recapOnlySession}
        </p>

        <ul
          aria-label={UI.recapVolumeChartA11y}
          className="flex items-end justify-between gap-1.5 border-b border-border pb-1.5"
        >
          {bars.map((bar, index) => {
            const isLast = index === lastIndex;
            const height = Math.max(
              MIN_BAR_HEIGHT_PX,
              Math.round((bar.volume / max) * MAX_BAR_HEIGHT_PX),
            );
            return (
              <li
                key={bar.sessionKey}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "font-one-more text-[10px] font-bold italic tabular-nums",
                    isLast
                      ? "rounded-sm bg-accent px-1 py-0.5 text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {formatRecapNumber(bar.volume)}
                </span>
                <span
                  aria-hidden
                  style={{ height }}
                  className={cn(
                    "w-full max-w-8 rounded-t-md",
                    isLast ? "bg-black dark:bg-white" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] text-muted-foreground",
                    isLast && "font-bold text-foreground",
                  )}
                >
                  {barLabel(bar, dayCounts)}
                </span>
              </li>
            );
          })}
        </ul>

        <dl className="grid grid-cols-4 gap-1.5">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{stat.label}</dt>
              <dd className="font-one-more text-sm font-bold uppercase italic tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
