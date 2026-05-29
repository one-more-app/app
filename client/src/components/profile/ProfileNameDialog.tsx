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
import { setUserProfileAndWait } from "@/lib/storage";
import { UI } from "@/lib/translations";
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

  useEffect(() => {
    if (!open || !profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
  }, [open, profile]);

  const handleSave = () => {
    void (async () => {
      await setUserProfileAndWait({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      await refreshProfile();
      toast.success(UI.profileNameSaved);
      onOpenChange(false);
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {UI.cancel}
          </Button>
          <Button onClick={handleSave}>{UI.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
