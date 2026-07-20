import { eventChipEntrance } from "@/components/event/event-motion";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

export function EventGenderBadge({
  gender,
  className,
}: {
  gender: "male" | "female";
  className?: string;
}) {
  const label = gender === "male" ? UI.eventStandMen : UI.eventStandWomen;

  return (
    <div
      key={gender}
      className={eventChipEntrance(
        "inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-one-more uppercase italic tracking-wide text-accent-foreground",
        className,
      )}
    >
      {label}
    </div>
  );
}

export function EventGenderProgress({ progress }: { progress: number }) {
  return (
    <div className="h-1 w-32 overflow-hidden rounded-full bg-secondary/80">
      <div
        className={cn("h-full rounded-full bg-accent ease-linear transition-[width] duration-100")}
        style={{ width: `${Math.min(100, progress * 100)}%` }}
      />
    </div>
  );
}
