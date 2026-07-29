import { UnreadCountBadge } from "@/components/ui/unread-count-badge";
import { hapticImpact } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

type NotificationBellButtonProps = {
  unreadCount: number;
  onClick: () => void;
  className?: string;
};

export function NotificationBellButton({
  unreadCount,
  onClick,
  className,
}: NotificationBellButtonProps) {
  const ariaLabel =
    unreadCount > 0
      ? UI.notificationsBellAriaUnread.replace(
          "{count}",
          String(unreadCount),
        )
      : UI.notificationsBellAria;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void hapticImpact();
        onClick();
      }}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full",
        "text-muted-foreground outline-none transition-colors",
        "hover:bg-secondary hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Bell className="size-4" aria-hidden />
      {unreadCount > 0 ? (
        <UnreadCountBadge
          count={unreadCount}
          size="md"
          className="absolute -right-0.5 -top-0.5"
        />
      ) : null}
    </button>
  );
}
