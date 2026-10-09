import {
  RecapRecordCard,
  type RecapRecord,
} from "@/components/session/recap/RecapRecordCard";
import { RecapShareDrawer } from "@/components/session/recap/RecapShareDrawer";
import { RecapShareSection } from "@/components/session/recap/RecapShareSection";
import { RecapVolumeCard } from "@/components/session/recap/RecapVolumeCard";
import type { SessionRecapShareVariant } from "@/components/share/SessionRecapShareCard";
import { Button } from "@/components/ui/button";
import { usePerformanceEntriesData } from "@/hooks/use-api-data";
import { useLocalPerformanceEntries } from "@/hooks/use-local-data-store";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { mergePerformanceEntriesById } from "@/lib/activity-from-performances";
import {
  buildRecentVolumeSessions,
  entryVolume,
  formatCompactDuration,
} from "@/lib/home-day";
import type { WorkoutSession } from "@/lib/session-api";
import { buildSessionRecapSharePayload } from "@/lib/session-recap-share-data";
import { UI } from "@/lib/translations";
import { Share2 } from "lucide-react";
import { useMemo, useState } from "react";

const MAX_BARS = 6;

function buildRecords(session: WorkoutSession): RecapRecord[] {
  const bestByExercise = new Map<string, WorkoutSession["entries"][number]>();
  for (const entry of session.entries) {
    if (entry.deletedAt || !entry.leagueInsight?.isRecord) continue;
    const current = bestByExercise.get(entry.trackedExerciseId);
    if (
      !current ||
      entry.weight > current.weight ||
      (entry.weight === current.weight && entry.reps > current.reps)
    ) {
      bestByExercise.set(entry.trackedExerciseId, entry);
    }
  }
  return [...bestByExercise.values()].map((entry) => {
    const exercise = session.exercises.find(
      (candidate) => candidate.id === entry.trackedExerciseId,
    );
    return {
      entryId: entry.id,
      trackedExerciseId: entry.trackedExerciseId,
      name: exercise?.name ?? UI.exerciseNotFound,
      gifUrl: exercise?.gifUrl,
      isCustom: exercise?.isCustom,
      bodyPart: exercise?.bodyPart,
      target: exercise?.target,
      league: entry.leagueInsight.nextLeague,
      weight: entry.weight,
      reps: entry.reps,
    };
  });
}

/** Bloc récap (volume, share, records) pour la page séance hybride. */
export function SessionRecapBlocks({ session }: { session: WorkoutSession }) {
  const date = session.date;
  const { data: remoteEntries } = usePerformanceEntriesData();
  const localEntries = useLocalPerformanceEntries();

  const sessionEntries = useMemo(
    () => session.entries.filter((entry) => !entry.deletedAt),
    [session.entries],
  );

  const { timing } = useSessionTiming(sessionEntries, {
    dayKey: date,
    isPresenceTraining: session.isLive,
    endedAt: session.endedAt,
  });

  const totalVolume = useMemo(
    () => sessionEntries.reduce((sum, entry) => sum + entryVolume(entry), 0),
    [sessionEntries],
  );

  const bars = useMemo(() => {
    const previous = mergePerformanceEntriesById(
      remoteEntries ?? [],
      localEntries,
    ).filter((entry) => !entry.deletedAt && entry.date < date);
    return [
      ...buildRecentVolumeSessions(previous, date, MAX_BARS - 1),
      { dayKey: date, volume: totalVolume },
    ];
  }, [remoteEntries, localEntries, date, totalVolume]);

  const records = useMemo(() => buildRecords(session), [session]);

  const [shareVariant, setShareVariant] =
    useState<SessionRecapShareVariant>("stats");
  const [shareOpen, setShareOpen] = useState(false);

  const sharePayload = useMemo(
    () =>
      buildSessionRecapSharePayload(session, {
        dateLabel: new Date(`${date}T12:00:00`)
          .toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })
          .replace(/\.$/, ""),
        volume: totalVolume,
        durationLabel: timing
          ? formatCompactDuration(timing.durationMs)
          : "–",
      }),
    [session, date, totalVolume, timing],
  );

  const openShare = (variant: SessionRecapShareVariant) => {
    setShareVariant(variant);
    setShareOpen(true);
  };

  return (
    <>
      <RecapVolumeCard
        totalVolume={totalVolume}
        bars={bars}
        stats={[
          {
            label: UI.recapDuration,
            value: timing ? formatCompactDuration(timing.durationMs) : "–",
          },
          { label: UI.recapExercises, value: String(session.exerciseCount) },
          { label: UI.recapSets, value: String(session.setCount) },
          { label: UI.recapXp, value: `+${session.xpEarned ?? 0}` },
        ]}
      />

      <RecapShareSection payload={sharePayload} onOpen={openShare} />

      {records.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-one-more text-sm font-bold uppercase italic">
            {records.length === 1
              ? UI.recapRecordsTitleOne
              : UI.recapRecordsTitle.replace(
                  "{count}",
                  String(records.length),
                )}
          </h2>
          <ul className="space-y-3">
            {records.map((record) => (
              <RecapRecordCard key={record.entryId} record={record} />
            ))}
          </ul>
        </section>
      ) : null}

      <Button
        type="button"
        variant="accent"
        className="h-12 w-full font-bold uppercase italic"
        onClick={() => openShare("stats")}
        data-analytics-label="recap_share_cta"
      >
        <Share2 className="size-4" aria-hidden />
        {UI.recapShareCta}
      </Button>

      <RecapShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        payload={sharePayload}
        initialVariant={shareVariant}
      />
    </>
  );
}
