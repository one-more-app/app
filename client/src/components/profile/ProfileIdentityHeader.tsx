import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfileData } from "@/hooks/use-api-data";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { ProfileNameDialog } from "./ProfileNameDialog";

export function ProfileIdentityHeader() {
  const auth = useAuth();
  const { data: profile } = useUserProfileData();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  const displayName = getProfileDisplayName(profile, auth.user);
  const initials = getProfileInitials(profile, auth.user);

  return (
    <>
      <div className="flex items-center gap-4">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {displayName}
          </h1>
          {auth.user?.email ? (
            <p className="truncate text-sm text-muted-foreground">
              {auth.user.email}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setNameDialogOpen(true)}
          aria-label={UI.profileEditName}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
      <ProfileNameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
      />
    </>
  );
}
