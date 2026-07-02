import { trackRestTimerDismissed } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { RestCounterTour } from "@/components/RestCounterTour";
import { RestTargetQuickEdit } from "@/components/RestTargetQuickEdit";
import { useRestSinceLastSet } from "@/hooks/use-rest-since-last-set";
import { formatRestElapsedA11y } from "@/lib/format-rest-elapsed";
import { hapticNotificationSuccess } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  const {
    visible,
    elapsedMs,
    formatted,
    progress01,
    targetComplete,
  } = useRestSinceLastSet(createdAt);
  const navigate = useNavigate();
  const notifiedForCreatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!createdAt || !visible || !targetComplete) return;
    if (notifiedForCreatedAtRef.current === createdAt) return;
    notifiedForCreatedAtRef.current = createdAt;
    toast.success(UI.restTimeFinished);
    void hapticNotificationSuccess();
  }, [createdAt, targetComplete, visible]);

  const a11yTime = useMemo(
    () => formatRestElapsedA11y(elapsedMs),
    [elapsedMs],
  );

  const a11yLabel = targetComplete
    ? UI.restTimeFinishedA11y.replace("{time}", a11yTime)
    : UI.restSinceLastSetA11y.replace("{time}", a11yTime);

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
    <>
      <div
        data-tour="rest-counter"
        className={cn(
          "border-t px-4 py-2",
          targetComplete
            ? "border-accent/50 bg-accent/25"
            : "border-border bg-transparent",
          className,
        )}
        role="status"
        aria-label={a11yLabel}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              {targetComplete ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                  <Check className="size-3" aria-hidden="true" />
                  {UI.restSinceLastSet}
                </span>
              ) : (
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {UI.restSinceLastSet}
                </span>
              )}
              <RestTargetQuickEdit />
            </div>
            {sourceExercise?.name ? (
              canNavigate ? (
                <button
                  type="button"
                  onClick={openSourceExercise}
                  className={cn(
                    "truncate text-left text-[0.6875rem] leading-tight text-muted-foreground/80",
                    "rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  aria-label={`${UI.restSinceLastSet} — ${sourceExercise.name}`}
                >
                  {sourceExercise.name}
                </button>
              ) : (
                <span className="truncate text-[0.6875rem] leading-tight text-muted-foreground/80">
                  {sourceExercise.name}
                </span>
              )
            ) : null}
          </div>
          <span
            className="shrink-0 font-one-more text-lg font-bold italic tabular-nums text-foreground"
            aria-hidden="true"
          >
            {formatted}
          </span>
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
              "h-full rounded-full",
              targetComplete ? "bg-accent" : "bg-accent",
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
      <RestCounterTour barVisible />
    </>
  );
}
