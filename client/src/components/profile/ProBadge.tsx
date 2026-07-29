import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

type ProBadgeProps = {
  className?: string;
};

export function ProBadge({ className }: ProBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-one-more font-semibold uppercase italic leading-none tracking-tight text-background",
        className,
      )}
    >
      {UI.proBadge}
    </span>
  );
}
