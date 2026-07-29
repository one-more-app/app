import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { hapticImpact } from "@/lib/haptics";
import {
  getUserProfilePath,
  type UserProfileLinkOptions,
} from "@/lib/user-profile-path";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type ProfileAvatarLinkProps = {
  userId: string;
  avatarUrl?: string | null;
  initials: string;
  sizeClassName?: string;
  textSizeClassName?: string;
  linkOptions?: UserProfileLinkOptions;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  stopPropagation?: boolean;
};

export function ProfileAvatarLink({
  userId,
  avatarUrl,
  initials,
  sizeClassName = "size-10",
  textSizeClassName = "text-sm",
  linkOptions,
  className,
  onClick,
  stopPropagation = false,
}: ProfileAvatarLinkProps) {
  return (
    <Link
      to={getUserProfilePath(userId, linkOptions)}
      className={cn("shrink-0", className)}
      aria-label={UI.friendViewProfile}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        void hapticImpact();
        onClick?.(event);
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={cn(sizeClassName, "rounded-full object-cover")}
        />
      ) : (
        <ProfileAvatarFallback
          initials={initials}
          className={cn(sizeClassName, "rounded-full", textSizeClassName)}
        />
      )}
    </Link>
  );
}
