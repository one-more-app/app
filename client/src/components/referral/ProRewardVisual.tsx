import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

type ProRewardVisualProps = {
  highlight?: boolean;
  compact?: boolean;
  className?: string;
};

export function ProRewardVisual({
  highlight = false,
  compact = false,
  className,
}: ProRewardVisualProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center",
        !compact && "rounded-xl px-4 py-5",
        !compact &&
          "bg-gradient-to-b from-accent/25 via-accent/10 to-transparent",
        highlight && !compact && "ring-2 ring-accent/40",
        className,
      )}
      aria-label={UI.referralProVisualAlt}
    >
      <span
        className={cn(
          "referral-pro-emerge-anim inline-flex items-center justify-center rounded-full bg-foreground font-one-more font-semibold uppercase italic leading-none tracking-tight text-background",
          compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-sm",
        )}
      >
        {UI.proBadge}
      </span>

      {!compact ? (
        <>
          <p className="mt-3 text-sm font-one-more uppercase italic tracking-wide text-foreground">
            {UI.referralProVisualTitle}
          </p>
          <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
            {UI.referralProVisualSubtitle}
          </p>
        </>
      ) : null}
    </div>
  );
}
