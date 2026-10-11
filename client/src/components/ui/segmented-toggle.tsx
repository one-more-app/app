import { hapticTab } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SegmentedToggleItem<T extends string> = {
    id: T;
    label: string;
    Icon?: LucideIcon;
};

type SegmentedToggleProps<T extends string> = {
    value: T;
    onChange: (value: T) => void;
    items: readonly SegmentedToggleItem<T>[];
    ariaLabel: string;
    /** Préfixe pour `id` / `aria-controls` des onglets (ex. ranking). */
    idPrefix?: string;
    className?: string;
};

/** Toggle segmenté (ex. Salle / Potes, Sur ma photo / Sticker). */
export function SegmentedToggle<T extends string>({
    value,
    onChange,
    items,
    ariaLabel,
    idPrefix,
    className,
}: SegmentedToggleProps<T>) {
    return (
        <div
            className={cn("flex gap-1 rounded-xl bg-card p-1", className)}
            role="tablist"
            aria-label={ariaLabel}
        >
            {items.map(({ id, label, Icon }) => {
                const active = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        {...(idPrefix
                            ? {
                                  id: `${idPrefix}-tab-${id}`,
                                  "aria-controls": `${idPrefix}-panel-${id}`,
                              }
                            : {})}
                        onClick={() => {
                            if (!active) hapticTab();
                            onChange(id);
                        }}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 sm:gap-2 cursor-pointer",
                            "text-sm font-medium transition-[color,transform,background-color]",
                            "active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                            active
                                ? "bg-primary text-primary-foreground dark:bg-primary-foreground dark:text-primary"
                                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                        )}
                    >
                        {Icon ? (
                            <Icon className="size-4 shrink-0" aria-hidden />
                        ) : null}
                        <span className="truncate">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
