import { BackHeader } from "@/components/BackHeader";
import {
  RecapRecordCard,
  type RecapRecord,
} from "@/components/session/recap/RecapRecordCard";
import { RecapShareDrawer } from "@/components/session/recap/RecapShareDrawer";
import { RecapShareSection } from "@/components/session/recap/RecapShareSection";
import { RecapVolumeCard } from "@/components/session/recap/RecapVolumeCard";
import type { SessionRecapShareVariant } from "@/components/share/SessionRecapShareCard";
import { HistoryPageSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { usePerformanceEntriesData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { useLocalPerformanceEntries } from "@/hooks/use-local-data-store";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { mergePerformanceEntriesById } from "@/lib/activity-from-performances";
import {
  buildRecentVolumeSessions,
  entryVolume,
  formatCompactDuration,
  formatHomeDayTitle,
} from "@/lib/home-day";
import { fetchSession, sessionSwrKey, type WorkoutSession } from "@/lib/session-api";
import { buildSessionRecapSharePayload } from "@/lib/session-recap-share-data";
import { UI } from "@/lib/translations";
import { Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import useSWR from "swr";

const MAX_BARS = 6;

function formatClock(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Un record par exercice : la série la plus lourde (puis la plus longue). */
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

/**
 * Récap de séance (captures 40 et 41). Le partage en story (capture 42) s'ouvre
 * depuis le bouton d'en-tête, les miniatures et le CTA du bas.
 */
export default function RecapPage() {
  const { ownerUserId, date } = useParams<{
    ownerUserId: string;
    date: string;
  }>();
  const auth = useAuth();
  const currentUserId =
    auth.status === "authenticated" ? (auth.user?.id ?? null) : null;

  const { data: session, isLoading, error } = useSWR(
    ownerUserId && date ? sessionSwrKey(ownerUserId, date) : null,
    () => fetchSession(ownerUserId!, date!),
  );
  const { data: remoteEntries } = usePerformanceEntriesData();
  const localEntries = useLocalPerformanceEntries();

  const sessionEntries = useMemo(
    () => (session?.entries ?? []).filter((entry) => !entry.deletedAt),
    [session],
  );

  const { timing } = useSessionTiming(sessionEntries, {
    dayKey: date ?? "",
    isPresenceTraining: session?.isLive,
    endedAt: session?.endedAt,
  });

  const totalVolume = useMemo(
    () => sessionEntries.reduce((sum, entry) => sum + entryVolume(entry), 0),
    [sessionEntries],
  );

  const bars = useMemo(() => {
    if (!date) return [];
    const previous = mergePerformanceEntriesById(
      remoteEntries ?? [],
      localEntries,
    ).filter((entry) => !entry.deletedAt && entry.date < date);
    return [
      ...buildRecentVolumeSessions(previous, date, MAX_BARS - 1),
      { dayKey: date, volume: totalVolume },
    ];
  }, [remoteEntries, localEntries, date, totalVolume]);

  const records = useMemo(() => (session ? buildRecords(session) : []), [session]);

  const [shareVariant, setShareVariant] =
    useState<SessionRecapShareVariant>("stats");
  const [shareOpen, setShareOpen] = useState(false);

  const dateLabel = date ? formatHomeDayTitle(date) : "";
  const sharePayload = useMemo(
    () =>
      session
        ? buildSessionRecapSharePayload(session, {
            dateLabel: date
              ? new Date(`${date}T12:00:00`)
                  .toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })
                  .replace(/\.$/, "")
              : "",
            volume: totalVolume,
            durationLabel: timing
              ? formatCompactDuration(timing.durationMs)
              : "–",
          })
        : null,
    [session, date, totalVolume, timing],
  );

  const openShare = (variant: SessionRecapShareVariant) => {
    setShareVariant(variant);
    setShareOpen(true);
  };

  if (!ownerUserId || !date) return <Navigate to="/home" replace />;
  // Le récap est personnel : un ami retombe sur la séance partagée.
  if (auth.status === "authenticated" && currentUserId !== ownerUserId) {
    return <Navigate to={`/session/${ownerUserId}/${date}`} replace />;
  }

  const subtitle = timing
    ? timing.endedAt
      ? UI.recapDateRange
          .replace("{date}", dateLabel)
          .replace("{start}", formatClock(timing.startedAt))
          .replace("{end}", formatClock(timing.endedAt))
      : UI.recapDateOnly
          .replace("{date}", dateLabel)
          .replace("{start}", formatClock(timing.startedAt))
    : dateLabel;

  return (
    <div className="min-h-screen-app bg-background pb-8">
      <BackHeader
        title={UI.recapTitle}
        description={subtitle}
        right={
          <Button
            variant="secondary"
            size="icon"
            onClick={() => openShare("stats")}
            disabled={!sharePayload}
            aria-label={UI.recapShareAria}
            data-analytics-label="recap_share_header"
          >
            <Share2 className="size-4" />
          </Button>
        }
      />

      <main className="mx-auto max-w-2xl space-y-6 p-4">
        {isLoading ? (
          <HistoryPageSkeleton />
        ) : error || !session ? (
          <p className="text-sm text-destructive">{UI.recapUnavailable}</p>
        ) : (
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

            {sharePayload ? (
              <RecapShareSection payload={sharePayload} onOpen={openShare} />
            ) : null}

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
          </>
        )}
      </main>

      {sharePayload ? (
        <RecapShareDrawer
          open={shareOpen}
          onOpenChange={setShareOpen}
          payload={sharePayload}
          initialVariant={shareVariant}
        />
      ) : null}
    </div>
  );
}
