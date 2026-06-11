import { UsernameField, type UsernameFieldStatus } from "@/components/profile/UsernameField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileDataRefresh, useUserProfileData } from "@/hooks/use-api-data";
import { updateProfileUsername } from "@/lib/profile-username-api";
import { setUserProfileAndWait } from "@/lib/storage";
import { UI } from "@/lib/translations";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ProfileNameDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: profile } = useUserProfileData();
  const refreshProfile = useProfileDataRefresh();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameFieldStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setUsername(profile.username ?? "");
    setUsernameStatus("idle");
  }, [open, profile]);

  const normalizedUsername = normalizeUsername(username);
  const initialUsername = profile?.username?.trim() ?? "";
  const usernameChanged =
    normalizedUsername.length > 0 && normalizedUsername !== initialUsername;
  const usernameValid =
    !usernameChanged ||
    (isValidUsername(normalizedUsername) && usernameStatus === "available");
  const canSave = usernameValid && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    void (async () => {
      setIsSaving(true);
      try {
        if (usernameChanged) {
          await updateProfileUsername(normalizedUsername);
        }
        await setUserProfileAndWait({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          ...(usernameChanged ? { username: normalizedUsername } : {}),
        });
        await refreshProfile();
        toast.success(UI.profileNameSaved);
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{UI.profileEditName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-first-name">{UI.profileFirstName}</Label>
            <Input
              id="profile-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-last-name">{UI.profileLastName}</Label>
            <Input
              id="profile-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <UsernameField
            value={username}
            onChange={setUsername}
            onStatusChange={setUsernameStatus}
            useProfileCheck
            id="profile-username"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {UI.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
