import { ExerciseImage } from "@/components/ExerciseImage";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { LeagueInfo } from "@/lib/league-types";
import { UI } from "@/lib/translations";
import { Trophy } from "lucide-react";

export type RecapRecord = {
  entryId: string;
  trackedExerciseId: string;
  name: string;
  gifUrl?: string;
  isCustom?: boolean;
  bodyPart?: string;
  target?: string;
  league: LeagueInfo | null;
  weight: number;
  reps: number;
};

function recordValue(weight: number, reps: number): string {
  if (weight === 0) return `${reps} reps`;
  return `${weight} kg × ${reps}`;
}

/** Carte d'un nouveau record (captures 40 et 41). */
export function RecapRecordCard({ record }: { record: RecapRecord }) {
  return (
    <li>
      <Card className="py-0">
        <CardContent className="flex items-center gap-3 p-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
            <ExerciseImage
              gifUrl={record.gifUrl}
              isCustom={record.isCustom}
              bodyPart={record.bodyPart}
              target={record.target}
              className="size-full"
              imgClassName="size-full object-cover"
              fallbackIconClassName="size-6 text-neutral-400"
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <p className="w-full truncate font-one-more text-sm font-bold uppercase italic">
              {record.name}
            </p>
            {record.league ? (
              <RankBadge league={record.league} size="sm" />
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="dark inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[11px] font-bold">
              <Trophy className="size-3 text-accent" aria-hidden />
              <span className="accent-text">{UI.record}</span>
            </span>
            <p className="font-one-more text-base font-bold uppercase italic tabular-nums">
              {recordValue(record.weight, record.reps)}
            </p>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
