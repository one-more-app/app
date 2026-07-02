import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export type BattlePassNodeStatus = "done" | "current" | "locked";

type BattlePassNodeProps = {
    label: string;
    sublabel: string;
    status: BattlePassNodeStatus;
    icon: ReactNode;
    highlightSublabel?: boolean;
    className?: string;
};

export function BattlePassNode({
    label,
    sublabel,
    status,
    icon,
    highlightSublabel = false,
    className,
}: BattlePassNodeProps) {
    const isHighlighted = highlightSublabel && status === "current";

    return (
        <div
            className={cn(
                "flex w-10 flex-col items-center gap-1 sm:w-11",
                className,
            )}
        >
            <div
                className={
                    status === "done"
                        ? "flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm"
                        : status === "current"
                          ? "flex size-8 items-center justify-center rounded-full border-2 border-accent bg-background text-foreground shadow-[0_0_0_3px] shadow-accent/25"
                          : "flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
                }
            >
                {status === "done" ? (
                    <Check className="size-4" strokeWidth={2.5} />
                ) : (
                    icon
                )}
            </div>
            {label ? (
                <span className="text-[10px] font-semibold tabular-nums text-foreground">
                    {label}
                </span>
            ) : null}
            <span
                className={
                    isHighlighted
                        ? "text-center text-[9px] font-semibold leading-tight text-accent"
                        : "text-center text-[9px] leading-tight text-muted-foreground"
                }
            >
                {sublabel}
            </span>
        </div>
    );
}
