import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { upsertRemoteProfile } from "@/lib/data-api";
import {
  fileToAvatarDataUrl,
  getProfileAvatarUrl,
  setProfileAvatarUrl,
} from "@/lib/profile-avatar";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { profileNestedClass, profileSectionClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function getProfileNameParts(firstName?: string, lastName?: string) {
  return {
    first: firstName?.trim() ?? "",
    last: lastName?.trim() ?? "",
  };
}

type ProfileIdentityHeaderProps = {
  profile?: UserProfile;
  avatarUrl?: string | null;
  readOnly?: boolean;
};

export function ProfileIdentityHeader({
  profile: profileProp,
  avatarUrl: avatarUrlProp,
  readOnly = false,
}: ProfileIdentityHeaderProps = {}) {
  const auth = useAuth();
  const { data: profileFromHook } = useUserProfileData();
  const profile = profileProp ?? profileFromHook;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(
    () => avatarUrlProp ?? getProfileAvatarUrl(),
  );

  useEffect(() => {
    const next = avatarUrlProp ?? profile?.avatarUrl ?? getProfileAvatarUrl();
    if (next) {
      setAvatarUrl(next);
      if (!readOnly) setProfileAvatarUrl(next);
    }
  }, [avatarUrlProp, profile?.avatarUrl, readOnly]);

  const initials = getProfileInitials(profile, readOnly ? null : auth.user);
  const { first, last } = getProfileNameParts(
    profile?.firstName,
    profile?.lastName,
  );
  const hasSplitName = Boolean(first && last);
  const displayName = getProfileDisplayName(
    profile,
    readOnly ? null : auth.user,
  );

  const handleAvatarClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file?.type.startsWith("image/")) return;

    void (async () => {
      try {
        const dataUrl = await fileToAvatarDataUrl(file);
        setProfileAvatarUrl(dataUrl);
        setAvatarUrl(dataUrl);
        if (profile?.weightKg && profile.heightCm && profile.gender) {
          await upsertRemoteProfile({
            ...profile,
            avatarUrl: dataUrl,
          });
        }
      } catch {
        // ignore — fichier illisible ou canvas indisponible
      }
    })();
  };

  const avatarClassName = cn(
    profileNestedClass,
    "relative size-11 shrink-0 overflow-hidden p-0",
    !readOnly &&
      "outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
  );

  const avatarInner = avatarUrl ? (
    <img src={avatarUrl} alt="" className="size-full object-cover" />
  ) : (
    <span
      className="flex size-full items-center justify-center text-sm font-semibold text-primary"
      aria-hidden
    >
      {initials}
    </span>
  );

  return (
    <section className={cn(profileSectionClass, "py-3")}>
      <div className="flex items-center gap-3">
        {readOnly ? (
          <div className={avatarClassName}>{avatarInner}</div>
        ) : (
          <button
            type="button"
            onClick={handleAvatarClick}
            className={avatarClassName}
            aria-label={UI.profileChangePhoto}
          >
            {avatarInner}
            <span
              className="absolute inset-x-0 bottom-0 flex h-4 items-center justify-center bg-background/80 backdrop-blur-[2px]"
              aria-hidden
            >
              <Camera className="size-2.5 text-muted-foreground" />
            </span>
          </button>
        )}

        {!readOnly ? (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <h1 className="min-w-0 flex-1 leading-tight">
            {hasSplitName ? (
              <>
                <span className="block truncate text-base font-semibold tracking-tight">
                  {first}
                </span>
                <span className="block truncate text-sm font-normal text-muted-foreground">
                  {last}
                </span>
              </>
            ) : (
              <span className="block truncate text-base font-semibold tracking-tight">
                {displayName}
              </span>
            )}
            {profile?.username ? (
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                @{profile.username}
              </span>
            ) : null}
          </h1>
          {!readOnly ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground"
            >
              <Link to="/settings" aria-label={UI.settings}>
                <Settings className="size-5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
