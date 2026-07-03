import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type RestTimeFinishedToastContentProps = {
  exerciseName: string;
  onOpen: () => void;
  toastId: string | number;
};

export function RestTimeFinishedToastContent({
  exerciseName,
  onOpen,
  toastId,
}: RestTimeFinishedToastContentProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-left",
        "rounded-xl transition-colors hover:bg-muted/50 active:bg-muted/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
      )}
      aria-label={UI.restTimeFinishedToastA11y.replace(
        "{exercise}",
        exerciseName,
      )}
      onClick={() => {
        toast.dismiss(toastId);
        onOpen();
      }}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent"
        aria-hidden="true"
      >
        <Check className="size-4 text-accent-foreground" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold leading-tight text-foreground">
          {UI.restTimeFinished}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted-foreground">
          {exerciseName}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
}
