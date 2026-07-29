import { cn } from "@/lib/utils";

type UnreadCountBadgeProps = {
  count: number;
  size?: "sm" | "md";
  variant?: "primary" | "accent" | "onAccent";
  className?: string;
};

export function UnreadCountBadge({
  count,
  size = "sm",
  variant = "primary",
  className,
}: UnreadCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold leading-none",
        size === "md" ? "min-h-4 min-w-4 px-1 text-[10px]" : "size-5 text-[10px]",
        variant === "onAccent"
          ? "bg-accent-foreground text-accent"
          : variant === "accent"
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
