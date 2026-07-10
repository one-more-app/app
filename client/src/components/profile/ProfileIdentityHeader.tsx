import { SWR_KEYS, useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { uploadRemoteProfileAvatar } from "@/lib/data-api";
import { ProfileAvatarCropDialog } from "@/components/profile/ProfileAvatarCropDialog";
import {
  dataUrlToAvatarBlob,
  getProfileAvatarUrl,
  setProfileAvatarUrl,
} from "@/lib/profile-avatar";
import { ProfileNameDisplay } from "@/components/profile/ProfileNameDisplay";
import { getProfileInitials } from "@/lib/profile-display";
import { setUserProfile } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { profileNestedClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSWRConfig } from "swr";

function withAvatarCacheBuster(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
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
  const { mutate } = useSWRConfig();
  const { data: profileFromHook } = useUserProfileData();
  const profile = profileProp ?? profileFromHook;
  const userId = auth.user?.id ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropObjectUrlRef = useRef<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const resolveAvatarUrl = () => {
    const fromProfile = avatarUrlProp ?? profile?.avatarUrl ?? null;
    if (readOnly) return fromProfile;
    if (fromProfile) return fromProfile;
    return getProfileAvatarUrl(userId);
  };

  const [avatarUrl, setAvatarUrl] = useState(resolveAvatarUrl);
  const [avatarDisplaySrc, setAvatarDisplaySrc] = useState<string | null>(
    resolveAvatarUrl,
  );
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarRetryRef = useRef(false);

  useEffect(() => {
    const next = resolveAvatarUrl();
    setAvatarUrl(next);
    setAvatarDisplaySrc(next);
    setAvatarLoadFailed(false);
    avatarRetryRef.current = false;
    if (!readOnly && next) setProfileAvatarUrl(userId, next);
  }, [avatarUrlProp, profile?.avatarUrl, readOnly, userId]);

  useEffect(
    () => () => {
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current);
      }
    },
    [],
  );

  const initials = getProfileInitials(profile, readOnly ? null : auth.user);

  const handleAvatarClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const clearCropImage = () => {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = null;
    }
    setCropImageSrc(null);
  };

  const handleCropOpenChange = (open: boolean) => {
    setCropOpen(open);
    if (!open) clearCropImage();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file?.type.startsWith("image/")) return;

    clearCropImage();
    const objectUrl = URL.createObjectURL(file);
    cropObjectUrlRef.current = objectUrl;
    setCropImageSrc(objectUrl);
    setCropOpen(true);
  };

  const handleCropConfirm = (dataUrl: string) => {
    void (async () => {
      try {
        const blob = await dataUrlToAvatarBlob(dataUrl);
        const remote = await uploadRemoteProfileAvatar(blob);
        const nextUrl = remote.avatarUrl ?? dataUrl;
        setProfileAvatarUrl(userId, nextUrl);
        setAvatarUrl(nextUrl);
        setAvatarDisplaySrc(nextUrl);
        setAvatarLoadFailed(false);
        avatarRetryRef.current = false;
        if (profile) {
          setUserProfile(
            {
              ...profile,
              avatarUrl: nextUrl,
            },
            { silent: true },
          );
        }
        void mutate(SWR_KEYS.profile);
      } catch {
        setProfileAvatarUrl(userId, dataUrl);
        setAvatarUrl(dataUrl);
      }
    })();
  };

  const avatarClassName = cn(
    profileNestedClass,
    "relative size-11 shrink-0 overflow-hidden p-0",
    !readOnly &&
      "outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
  );

  const handleAvatarImageError = () => {
    if (
      avatarUrl &&
      !avatarUrl.startsWith("data:") &&
      !avatarRetryRef.current
    ) {
      avatarRetryRef.current = true;
      setAvatarDisplaySrc(withAvatarCacheBuster(avatarUrl));
      return;
    }
    setAvatarLoadFailed(true);
  };

  const avatarInner = avatarDisplaySrc && !avatarLoadFailed ? (
    <img
      key={avatarDisplaySrc}
      src={avatarDisplaySrc}
      alt=""
      className="size-full object-cover"
      onError={handleAvatarImageError}
    />
  ) : (
    <span
      className="flex size-full items-center justify-center text-sm font-semibold text-secondary-foreground"
      aria-hidden
    >
      {initials}
    </span>
  );

  return (
    <Card className="py-3">
      <CardContent className="pt-0">
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

        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <h1 className="min-w-0 flex-1 leading-tight">
            <ProfileNameDisplay
              profile={profile}
              authUser={readOnly ? null : auth.user}
            />
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
      </CardContent>

      {!readOnly ? (
        <ProfileAvatarCropDialog
          open={cropOpen}
          imageSrc={cropImageSrc}
          onOpenChange={handleCropOpenChange}
          onConfirm={handleCropConfirm}
        />
      ) : null}
    </Card>
  );
}
