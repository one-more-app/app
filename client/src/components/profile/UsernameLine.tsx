import { ProBadge } from "@/components/profile/ProBadge";
import { cn } from "@/lib/utils";

type UsernameLineProps = {
  username: string;
  isPremium?: boolean;
  className?: string;
};

export function UsernameLine({
  username,
  isPremium = false,
  className,
}: UsernameLineProps) {
  return (
    <span
      className={cn("flex min-w-0 items-center gap-1.5", className)}
    >
      <span className="min-w-0 truncate text-xs text-muted-foreground">
        @{username}
      </span>
      {isPremium ? <ProBadge /> : null}
    </span>
  );
}
