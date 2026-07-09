import { GymSearchPicker } from "@/components/gyms/GymSearchPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";

type GymChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasGym: boolean;
  onSaved?: () => void;
};

export function GymChangeDialog({
  open,
  onOpenChange,
  hasGym,
  onSaved,
}: GymChangeDialogProps) {
  const isNative = Capacitor.isNativePlatform();
  const title = hasGym ? UI.gymSettingsChange : UI.gymSettingsAdd;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      data-analytics-label="gym-change"
    >
      <DialogContent className="max-h-[min(90dvh,720px)] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {!isNative ? UI.gymOnboardingWebSearch : UI.gymOnboardingHint}
          </DialogDescription>
        </DialogHeader>
        <GymSearchPicker
          fromSettings
          showHint={false}
          onGymSaved={async () => {
            onSaved?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
