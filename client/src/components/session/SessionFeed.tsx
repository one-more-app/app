import { HomePastSession } from "@/components/home/HomePastSession";
import { ExerciseCardSkeletonList } from "@/components/skeletons";
import { useSessionsFeed } from "@/hooks/use-sessions-feed";
import { collectDayKeysFromEntries } from "@/lib/session-feed";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry } from "@/types";
import { useEffect, useMemo } from "react";

type SessionFeedProps = {
  ownerUserId: string;
  /** Perfs actives (ou déjà filtrées) de l'owner. */
  entries: PerformanceEntry[];
  /** Limite le nombre de séances affichées (profil = 2). */
  limit?: number;
  recapVariant?: "default" | "compact";
  className?: string;
  /** Notifie le parent du nombre d'items résolus et de l'état loading initial. */
  onItemsChange?: (count: number, loading: boolean) => void;
};

export function SessionFeed({
  ownerUserId,
  entries,
  limit,
  recapVariant = "compact",
  className,
  onItemsChange,
}: SessionFeedProps) {
  const dayKeys = useMemo(() => {
    const keys = collectDayKeysFromEntries(entries);
    return limit != null ? keys.slice(0, limit) : keys;
  }, [entries, limit]);
  const { data: items, isLoading, error } = useSessionsFeed(
    ownerUserId,
    dayKeys,
  );

  const shown = useMemo(() => {
    const list = items ?? [];
    return limit != null ? list.slice(0, limit) : list;
  }, [items, limit]);

  const loading = isLoading && !items;

  useEffect(() => {
    onItemsChange?.(shown.length, loading);
  }, [shown.length, loading, onItemsChange]);

  if (loading) {
    return <ExerciseCardSkeletonList count={3} compact />;
  }

  if (error && shown.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{UI.sessionUnavailable}</p>
    );
  }

  if (shown.length === 0) {
    if (entries.length > 0) {
      return (
        <p className="text-sm text-muted-foreground">{UI.sessionUnavailable}</p>
      );
    }
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      {shown.map((item) => {
        const dayEntries = entries.filter(
          (entry) => !entry.deletedAt && entry.date === item.date,
        );
        return (
          <HomePastSession
            key={item.id}
            ownerUserId={ownerUserId}
            dayKey={item.date}
            sessionId={item.id}
            dayEntries={dayEntries}
            allEntries={entries}
            title={item.title}
            recapVariant={recapVariant}
          />
        );
      })}
    </div>
  );
}
