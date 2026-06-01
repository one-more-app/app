import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import {
  fileToAvatarDataUrl,
  getProfileAvatarUrl,
  setProfileAvatarUrl,
} from "@/lib/profile-avatar";
import { getProfileInitials } from "@/lib/profile-display";
import { profileNestedClass, profileSectionClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";

function getProfileNameParts(firstName?: string, lastName?: string) {
  return {
    first: firstName?.trim() ?? "",
    last: lastName?.trim() ?? "",
  };
}

export function ProfileIdentityHeader() {
  const auth = useAuth();
  const { data: profile } = useUserProfileData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(() => getProfileAvatarUrl());

  const initials = getProfileInitials(profile, auth.user);
  const { first, last } = getProfileNameParts(
    profile?.firstName,
    profile?.lastName,
  );
  const hasSplitName = Boolean(first && last);
  const displayName =
    [first, last].filter(Boolean).join(" ") || UI.profileDefaultName;

  const handleAvatarClick = () => {
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
      } catch {
        // ignore — fichier illisible ou canvas indisponible
      }
    })();
  };

  return (
    <section className={cn(profileSectionClass, "py-3")}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAvatarClick}
          className={cn(
            profileNestedClass,
            "relative size-11 shrink-0 overflow-hidden p-0",
            "outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={UI.profileChangePhoto}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span
              className="flex size-full items-center justify-center text-sm font-semibold text-primary"
              aria-hidden
            >
              {initials}
            </span>
          )}
          <span
            className="absolute inset-x-0 bottom-0 flex h-4 items-center justify-center bg-background/80 backdrop-blur-[2px]"
            aria-hidden
          >
            <Camera className="size-2.5 text-muted-foreground" />
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />

        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 leading-tight">
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
          </h1>
        </div>
      </div>
    </section>
  );
}
