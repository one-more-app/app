import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import {
  adjustRestTargetMs,
  formatRestElapsed,
  REST_TARGET_MAX_MS,
  REST_TARGET_MIN_MS,
  REST_TARGET_PRESETS_MS,
} from "@/lib/format-rest-elapsed";
import { hapticSelectionChanged } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Minus, Plus, Timer } from "lucide-react";
import { useState } from "react";

type RestTargetQuickEditProps = {
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Panneau rendu inline (sans portal) — utilisé par l'app tour étape 2. */
  inlinePanel?: boolean;
};

type RestTargetQuickEditPanelProps = {
  formatted: string;
  targetMs: number;
  atMin: boolean;
  atMax: boolean;
  onStep: (deltaMs: number) => void;
  onApplyTarget: (nextMs: number) => void;
  className?: string;
};

function RestTargetQuickEditPanel({
  formatted,
  targetMs,
  atMin,
  atMax,
  onStep,
  onApplyTarget,
  className,
}: RestTargetQuickEditPanelProps) {
  return (
    <div
      data-tour="rest-counter-target-panel"
      className={cn("w-64 space-y-3 p-3", className)}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {UI.restTimeQuickEditLabel}
      </p>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          disabled={atMin}
          aria-label={UI.restTimeDecrease}
          onClick={() => onStep(-15_000)}
        >
          <Minus className="size-4" />
        </Button>
        <span className="font-one-more text-2xl font-bold italic tabular-nums text-foreground">
          {formatted}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          disabled={atMax}
          aria-label={UI.restTimeIncrease}
          onClick={() => onStep(15_000)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {REST_TARGET_PRESETS_MS.map((presetMs) => {
          const presetLabel = formatRestElapsed(presetMs);
          const active = presetMs === targetMs;
          return (
            <button
              key={presetMs}
              type="button"
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
              onClick={() => onApplyTarget(presetMs)}
            >
              {presetLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RestTargetQuickEditTrigger({
  className,
  formatted,
}: {
  className?: string;
  formatted: string;
}) {
  return (
    <button
      type="button"
      data-tour="rest-counter-target"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5",
        "text-[0.6875rem] font-medium tabular-nums text-foreground",
        "transition-colors hover:bg-muted active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
      aria-label={UI.restTimeQuickEditA11y.replace("{time}", formatted)}
      onClick={(event) => event.stopPropagation()}
    >
      <Timer className="size-3 text-muted-foreground" aria-hidden="true" />
      {formatted}
    </button>
  );
}

export function RestTargetQuickEdit({
  className,
  open: openProp,
  onOpenChange,
  inlinePanel = false,
}: RestTargetQuickEditProps) {
  const { targetMs, setTargetMs } = useRestTargetMs();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const formatted = formatRestElapsed(targetMs);

  const atMin = targetMs <= REST_TARGET_MIN_MS;
  const atMax = targetMs >= REST_TARGET_MAX_MS;

  const applyTarget = (nextMs: number) => {
    if (nextMs === targetMs) return;
    setTargetMs(nextMs);
    void hapticSelectionChanged();
  };

  const step = (deltaMs: number) => {
    applyTarget(adjustRestTargetMs(targetMs, deltaMs));
  };

  const panelProps = {
    formatted,
    targetMs,
    atMin,
    atMax,
    onStep: step,
    onApplyTarget: applyTarget,
  };

  if (inlinePanel) {
    return (
      <div
        data-tour="rest-counter-target-zone"
        className="relative inline-flex flex-col items-start"
      >
        <RestTargetQuickEditTrigger className={className} formatted={formatted} />
        {open ? (
          <RestTargetQuickEditPanel
            {...panelProps}
            className="z-[130] mt-1.5 rounded-lg border bg-popover text-popover-foreground shadow-md"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-tour="rest-counter-target-zone"
      className="relative inline-flex flex-col items-start"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <RestTargetQuickEditTrigger className={className} formatted={formatted} />
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="z-[130] p-0">
          <RestTargetQuickEditPanel {...panelProps} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
