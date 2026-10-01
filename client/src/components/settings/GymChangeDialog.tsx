import { GymSearchPicker } from "@/components/gyms/GymSearchPicker";
import {
  GymArrivalPermissionsPrompt,
  needsGymArrivalPermissions,
} from "@/components/settings/GymArrivalPermissionsPrompt";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

type GymChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasGym: boolean;
  onSaved?: () => void;
};

type DialogStep = "search" | "permissions";

export function GymChangeDialog({
  open,
  onOpenChange,
  hasGym,
  onSaved,
}: GymChangeDialogProps) {
  const isNative = Capacitor.isNativePlatform();
  const [step, setStep] = useState<DialogStep>("search");

  useEffect(() => {
    if (open) setStep("search");
  }, [open]);

  const close = () => onOpenChange(false);

  const title =
    step === "permissions"
      ? UI.gymArrivalPermissionsTitle
      : hasGym
        ? UI.gymSettingsChange
        : UI.gymSettingsAdd;

  const description =
    step === "permissions"
      ? undefined
      : !isNative
        ? UI.gymOnboardingWebSearch
        : UI.gymOnboardingHint;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      data-analytics-label="gym-change"
    >
      <DialogContent className="max-h-[min(90dvh,720px)] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              {UI.gymArrivalPermissionsBody}
            </DialogDescription>
          )}
        </DialogHeader>
        {step === "search" ? (
          <GymSearchPicker
            fromSettings
            showHint={false}
            onGymSaved={async () => {
              onSaved?.();
              const needsPrompt = await needsGymArrivalPermissions();
              if (needsPrompt) {
                setStep("permissions");
                return;
              }
              close();
            }}
          />
        ) : (
          <GymArrivalPermissionsPrompt onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
