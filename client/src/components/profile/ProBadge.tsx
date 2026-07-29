import { useAccess } from "@/hooks/use-access";
import { usePurchases } from "@/hooks/use-purchases";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { KeyboardEvent, MouseEvent } from "react";

type ProBadgeProps = {
  className?: string;
};

const badgeClassName =
  "inline-flex shrink-0 items-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-one-more font-semibold uppercase italic leading-none tracking-tight text-background";

export function ProBadge({ className }: ProBadgeProps) {
  const { isPremium } = useAccess();
  const { available, busy, subscribe } = usePurchases();
  const canOpenPaywall = !isPremium && available;

  const openPaywall = () => {
    if (busy) return;
    void subscribe("pro_badge");
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!canOpenPaywall) return;
    event.preventDefault();
    event.stopPropagation();
    openPaywall();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canOpenPaywall) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    openPaywall();
  };

  return (
    <span
      role={canOpenPaywall ? "button" : undefined}
      tabIndex={canOpenPaywall ? 0 : undefined}
      aria-label={canOpenPaywall ? UI.premiumSubscribeButton : undefined}
      aria-disabled={canOpenPaywall && busy ? true : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        badgeClassName,
        canOpenPaywall &&
          "cursor-pointer outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
        canOpenPaywall && busy && "pointer-events-none opacity-60",
        className,
      )}
    >
      {UI.proBadge}
    </span>
  );
}
