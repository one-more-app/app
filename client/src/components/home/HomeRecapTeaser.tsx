import { useHomeSessionById } from "@/hooks/use-day-sessions";
import { getActivityDayKey } from "@/lib/activity-from-performances";
import { hapticImpact } from "@/lib/haptics";
import {
    buildRecentVolumeSessions,
    entryVolume,
    formatHomeDayTitle,
} from "@/lib/home-day";
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

const MAX_BAR_HEIGHT_PX = 36;
const MAX_BAR_HEIGHT_COMPACT_PX = 28;

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
    const resolvedSessionId = sessionId ?? session?.id ?? null;
    const sessionKey = resolvedSessionId ?? `day:${dayKey}`;

    const bars = useMemo(() => {
        const scoped = entries.filter((entry) => {
            if (entry.deletedAt) return false;
            if (resolvedSessionId) return entry.workoutSessionId === resolvedSessionId;
            return getActivityDayKey(entry) === dayKey;
        });
        const volume = scoped.reduce((sum, entry) => sum + entryVolume(entry), 0);
        const startedAt =
            scoped.reduce<string | null>((min, entry) => {
                if (!min || entry.createdAt < min) return entry.createdAt;
                return min;
            }, null) ?? `${dayKey}T12:00:00.000Z`;
        const sessions = buildRecentVolumeSessions(entries, dayKey, 6, {
            throughSessionKey: sessionKey,
            anchor: {
                sessionKey,
                dayKey,
                volume,
                startedAt,
            },
        });
        const max = Math.max(...sessions.map((bar) => bar.volume), 1);
        return sessions.map((bar) => ({
            key: bar.sessionKey,
            height: Math.max(minBar, Math.round((bar.volume / max) * maxBar)),
        }));
    }, [entries, dayKey, sessionKey, resolvedSessionId, maxBar, minBar]);

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
                "dark flex items-center overflow-hidden rounded-xl bg-primary text-white outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "dark:bg-card dark:text-card-foreground dark:ring-1 dark:ring-border",
                compact ? "gap-3 px-3 py-2.5" : "gap-3 px-3.5 py-3",
            )}
        >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                    className="accent-text font-one-more text-[10px] font-bold uppercase italic tracking-wide"
                >
                    {UI.homeRecapLabel}
                </span>
                <span
                    className="font-one-more text-sm font-bold uppercase italic leading-none"
                >
                    {headline(records, exercises)}
                </span>
                <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                >
                    {UI.homeRecapCta}
                    <ChevronRight
                        className={cn("shrink-0", compact ? "size-3.5" : "size-3")}
                        aria-hidden
                    />
                </span>
            </span>
            {bars.length > 0 ? (
                <span
                    aria-hidden
                    className={cn(
                        "flex shrink-0 items-end gap-1",
                        compact ? "h-7" : "h-9",
                    )}
                >
                    {bars.map((bar, index) => (
                        <span
                            key={bar.key}
                            style={{ height: bar.height }}
                            className={cn(
                                "w-2 rounded-[3px]",
                                index === bars.length - 1
                                    ? "bg-accent"
                                    : "bg-white/35 dark:bg-foreground/25",
                            )}
                        />
                    ))}
                </span>
            ) : null}
        </Link>
    );
}
