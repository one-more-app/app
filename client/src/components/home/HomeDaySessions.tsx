import { HomePastSession } from "@/components/home/HomePastSession";
import { ExerciseCardSkeletonList } from "@/components/skeletons";
import { useDaySessions } from "@/hooks/use-day-sessions";
import { formatTimeOnly } from "@/lib/history-entries";
import { formatHomeDayTitle } from "@/lib/home-day";
import { UI } from "@/lib/translations";
import type { PerformanceEntry } from "@/types";

type HomeDaySessionsProps = {
  ownerUserId: string;
  dayKey: string;
  dayEntries: PerformanceEntry[];
  allEntries: PerformanceEntry[];
};

/**
 * Affiche chaque séance du jour séparément (plus récente en premier).
 * Évite d'agréger toutes les perfs du jour en un seul bloc.
 */
export function HomeDaySessions({
  ownerUserId,
  dayKey,
  dayEntries,
  allEntries,
}: HomeDaySessionsProps) {
  const { data, isLoading, error } = useDaySessions(ownerUserId, dayKey);
  const items = data?.items ?? [];

  if (isLoading && items.length === 0) {
    return <ExerciseCardSkeletonList count={3} compact />;
  }

  if (error && items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{UI.sessionUnavailable}</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{UI.sessionUnavailable}</p>
    );
  }

  const ordered = [...items].reverse();

  return (
    <div className="space-y-8">
      {ordered.map((item, index) => (
        <HomePastSession
          key={item.id}
          ownerUserId={ownerUserId}
          dayKey={dayKey}
          sessionId={item.id}
          dayEntries={dayEntries}
          allEntries={allEntries}
          title={
            ordered.length === 1
              ? undefined
              : index === 0
                ? formatHomeDayTitle(dayKey)
                : formatTimeOnly(item.startedAt)
          }
        />
      ))}
    </div>
  );
}
