import { Button } from "@/components/ui/button";
import { useRestSinceLastSet } from "@/hooks/use-rest-since-last-set";
import { formatRestElapsedA11y } from "@/lib/format-rest-elapsed";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

type RestSinceLastSetBarProps = {
  createdAt: string | null | undefined;
  className?: string;
};

export function RestSinceLastSetBar({
  createdAt,
  className,
}: RestSinceLastSetBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const { visible, elapsedMs, formatted, progress01 } =
    useRestSinceLastSet(createdAt);

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

  return (
    <div
      className={cn(
        "border-t border-border px-4 py-2",
        className,
      )}
      role="status"
      aria-label={a11yLabel}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {UI.restSinceLastSet}
          </span>
          <span
            className="font-one-more text-lg font-bold italic tabular-nums text-foreground"
            aria-hidden="true"
          >
            {formatted}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          onClick={() => setDismissed(true)}
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
