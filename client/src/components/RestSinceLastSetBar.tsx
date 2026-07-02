import { trackRestTimerDismissed } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useRestSinceLastSet } from "@/hooks/use-rest-since-last-set";
import { formatRestElapsedA11y } from "@/lib/format-rest-elapsed";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type RestSinceLastSetBarSourceExercise = {
  id: string;
  name: string;
};

type RestSinceLastSetBarProps = {
  createdAt: string | null | undefined;
  className?: string;
  sourceExercise?: RestSinceLastSetBarSourceExercise | null;
  /** Route de l'exo actuellement affiché — évite la re-navigation vers soi-même. */
  currentExerciseId?: string | null;
};

export function RestSinceLastSetBar({
  createdAt,
  className,
  sourceExercise,
  currentExerciseId,
}: RestSinceLastSetBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const { visible, elapsedMs, formatted, progress01 } =
    useRestSinceLastSet(createdAt);
  const navigate = useNavigate();

  const a11yTime = useMemo(
    () => formatRestElapsedA11y(elapsedMs),
    [elapsedMs],
  );

  const a11yLabel = UI.restSinceLastSetA11y.replace("{time}", a11yTime);

  if (!visible || dismissed) {
    return null;
  }

  const minuteBucket =
    elapsedMs >= 60_000 ? Math.floor(elapsedMs / 60_000) : null;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canNavigate =
    !!sourceExercise?.id && sourceExercise.id !== currentExerciseId;

  const openSourceExercise = () => {
    if (!canNavigate || !sourceExercise) return;
    navigate(`/exercise/${sourceExercise.id}`);
  };

  return (
    <div
      className={cn("border-t border-border px-4 py-2", className)}
      role="status"
      aria-label={a11yLabel}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <button
          type="button"
          onClick={openSourceExercise}
          disabled={!canNavigate}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            canNavigate
              ? "cursor-pointer hover:opacity-80 active:opacity-70"
              : "cursor-default",
          )}
          aria-label={
            canNavigate && sourceExercise
              ? `${a11yLabel} — ${sourceExercise.name}`
              : a11yLabel
          }
        >
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {UI.restSinceLastSet}
            </span>
            {sourceExercise?.name ? (
              <span className="truncate text-[0.6875rem] leading-tight text-muted-foreground/80">
                {sourceExercise.name}
              </span>
            ) : null}
          </div>
          <span
            className="font-one-more text-lg font-bold italic tabular-nums text-foreground"
            aria-hidden="true"
          >
            {formatted}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          onClick={(event) => {
            event.stopPropagation();
            trackRestTimerDismissed({
              elapsedMs,
              trackedExerciseId: sourceExercise?.id,
            });
            setDismissed(true);
          }}
          aria-label={UI.restSinceLastSetDismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div
        className="mx-auto mt-1.5 h-0.5 max-w-2xl overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className={cn(
            "h-full rounded-full bg-accent",
            !reducedMotion && "transition-[width] duration-1000 ease-linear",
          )}
          style={{ width: `${progress01 * 100}%` }}
        />
      </div>
      {minuteBucket != null ? (
        <span key={minuteBucket} className="sr-only" aria-live="polite">
          {a11yLabel}
        </span>
      ) : null}
    </div>
  );
}
