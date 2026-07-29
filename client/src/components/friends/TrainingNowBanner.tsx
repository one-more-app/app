import { ExerciseImage } from "@/components/ExerciseImage";
import { ExerciseTitle } from "@/components/ExerciseTitle";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const trainingNowSurfaceClass =
  "rounded-xl border border-accent/40 bg-accent/10";

type TrainingNowBannerProps = {
  to: string;
  exerciseLabel: string;
  gifUrl?: string | null;
  isCustom?: boolean | null;
  bodyPart?: string | null;
  target?: string | null;
  className?: string;
};

/** Bandeau live aligné cartes exo : font-one-more, surface accent. */
export function TrainingNowBanner({
  to,
  exerciseLabel,
  gifUrl,
  isCustom,
  bodyPart,
  target,
  className,
}: TrainingNowBannerProps) {
  return (
    <Link
      to={to}
      className={cn(
        trainingNowSurfaceClass,
        "flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-accent/15",
        className,
      )}
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-background">
        <ExerciseImage
          gifUrl={gifUrl ?? undefined}
          isCustom={isCustom ?? false}
          bodyPart={bodyPart ?? undefined}
          target={target ?? undefined}
          className="size-full"
          imgClassName="size-full object-cover"
          fallbackIconClassName="size-7 text-muted-foreground"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <ExerciseTitle
          as="h3"
          className="font-one-more text-xs uppercase italic text-foreground"
        >
          {exerciseLabel}
        </ExerciseTitle>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full bg-accent animate-pulse"
            aria-hidden
          />
          {UI.friendTrainingNowBanner}
        </span>
      </div>
    </Link>
  );
}
