import { toast } from "sonner";

import { XpProgressBlock } from "@/components/XpProgressBlock";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { XpGrantResult } from "@/types";

const XP_GAIN_TOAST_CLASS_NAMES = {
  toast: cn(
    "xp-gain-toast group toast font-sans",
    "w-[min(calc(100vw-2rem),42rem)]",
    "!rounded-xl !border-0 !bg-card !p-3",
    "!text-card-foreground",
    "!shadow-sm shadow-black/10",
    "dark:!shadow-md dark:shadow-black/35",
    "!backdrop-blur-none",
  ),
  content: "!m-0 w-full font-sans",
  title: "!m-0 w-full !font-normal !leading-normal font-sans",
};

function XpGainBadge({ amount }: { amount: number }) {
  return (
    <span
      className={cn(
        "celebration-count-anim inline-flex shrink-0 items-baseline gap-0.5",
        "rounded-full border border-accent/50 bg-accent/15 px-1.5 py-0.5",
      )}
      aria-label={UI.xpGainedToast.replace("{amount}", String(amount))}
    >
      <span className="font-one-more text-sm font-bold italic tabular-nums leading-none text-foreground">
        +{amount}
      </span>
      <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-muted-foreground">
        XP
      </span>
    </span>
  );
}

type XpGainToastContentProps = {
  xp: XpGrantResult;
  totalGained: number;
  streakBonusXp?: number;
  streakBonusPercent?: number;
};

function XpGainToastContent({
  xp,
  totalGained,
  streakBonusXp,
  streakBonusPercent,
}: XpGainToastContentProps) {
  const previousXpIntoLevel = Math.max(0, xp.xpIntoLevel - totalGained);

  const showBonus =
    streakBonusXp != null &&
    streakBonusXp > 0 &&
    streakBonusPercent != null &&
    streakBonusPercent > 0;

  return (
    <XpProgressBlock
      level={xp.level}
      xpIntoLevel={xp.xpIntoLevel}
      xpForNextLevel={xp.xpForNextLevel}
      animateFromXpIntoLevel={previousXpIntoLevel}
      rightSlot={<XpGainBadge amount={totalGained} />}
      footerSlot={
        showBonus ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {UI.xpGainedBonusDescription
              .replace("{bonus}", String(streakBonusXp))
              .replace("{percent}", String(streakBonusPercent))}
          </p>
        ) : null
      }
    />
  );
}

export function showXpGainToast(
  xp: XpGrantResult,
  totalGained: number,
  opts?: { streakBonusXp?: number; streakBonusPercent?: number },
): void {
  toast.custom(
    () => (
      <XpGainToastContent
        xp={xp}
        totalGained={totalGained}
        streakBonusXp={opts?.streakBonusXp}
        streakBonusPercent={opts?.streakBonusPercent}
      />
    ),
    {
      duration: 4500,
      unstyled: true,
      classNames: XP_GAIN_TOAST_CLASS_NAMES,
    },
  );
}
