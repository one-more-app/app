import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

type StreakFlameCountProps = {
  count: number;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function StreakFlameCount({
  count,
  className,
  iconClassName = "size-3.5",
  textClassName = "text-xs font-semibold tabular-nums",
}: StreakFlameCountProps) {
  if (count <= 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-orange-500",
        className,
      )}
      title={UI.streakRuleHint}
      aria-label={UI.streakDays.replace("{days}", String(count))}
    >
      <Flame className={cn(iconClassName, "shrink-0")} aria-hidden />
      <span className={textClassName}>{count}</span>
    </div>
  );
}
