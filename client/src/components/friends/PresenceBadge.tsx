import {
  getPresenceLabel,
  presenceDotClass,
} from "@/hooks/use-friends-presence";
import type { FriendPresence } from "@/types";
import { cn } from "@/lib/utils";

export function PresenceBadge({
  presence,
  showLabel = true,
  className,
}: {
  presence?: FriendPresence;
  showLabel?: boolean;
  className?: string;
}) {
  if (!presence || presence.status === "offline") return null;
  const label = getPresenceLabel(presence);
  if (!label) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", presenceDotClass(presence.status))}
        aria-hidden
      />
      {showLabel ? <span className="truncate">{label}</span> : null}
    </span>
  );
}
