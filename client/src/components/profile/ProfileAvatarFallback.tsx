import { cn } from "@/lib/utils";

/** Fond + texte lisibles en clair comme en sombre (évite primary/#1a1a1a sur fond sombre). */
export const profileAvatarFallbackClassName =
  "flex shrink-0 items-center justify-center bg-secondary font-semibold text-secondary-foreground";

type ProfileAvatarFallbackProps = {
  initials: string;
  className?: string;
};

export function ProfileAvatarFallback({
  initials,
  className,
}: ProfileAvatarFallbackProps) {
  return (
    <div className={cn(profileAvatarFallbackClassName, className)} aria-hidden>
      {initials}
    </div>
  );
}
