import { UsernameField, type UsernameFieldStatus } from "@/components/profile/UsernameField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfileDataRefresh } from "@/hooks/use-api-data";
import { updateProfileUsername } from "@/lib/profile-username-api";
import { setUserProfile } from "@/lib/storage";
import { UI } from "@/lib/translations";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileUsernameSetupDialog() {
  const refreshProfile = useProfileDataRefresh();
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameFieldStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);

  const normalizedUsername = normalizeUsername(username);
  const canSave =
    isValidUsername(normalizedUsername) &&
    usernameStatus === "available" &&
    !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    void (async () => {
      setIsSaving(true);
      try {
        const remote = await updateProfileUsername(normalizedUsername);
        setUserProfile({
          username: remote.username ?? normalizedUsername,
        });
        await refreshProfile();
        toast.success(UI.profileUsernameSaved);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : UI.profileUsernameSaveError,
        );
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{UI.usernameTitle}</DialogTitle>
        </DialogHeader>
        <UsernameField
          value={username}
          onChange={setUsername}
          onStatusChange={setUsernameStatus}
          useProfileCheck
          autoFocus
          id="setup-username"
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave}>
            {UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
