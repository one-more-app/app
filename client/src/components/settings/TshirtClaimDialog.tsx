import { TshirtRewardVisual } from "@/components/profile/TshirtRewardVisual";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/use-access";
import { ApiError } from "@/lib/api";
import {
  claimTshirtReward,
  TSHIRT_REWARD_SWR_KEY,
  TSHIRT_SIZES,
  type TshirtSize,
} from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

type TshirtClaimDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimed?: () => void;
};

export function TshirtClaimDialog({
  open,
  onOpenChange,
  onClaimed,
}: TshirtClaimDialogProps) {
  const { refresh: refreshAccess } = useAccess();
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("France");
  const [size, setSize] = useState<TshirtSize>("M");
  const [busy, setBusy] = useState(false);

  const handleSubmit = () => {
    void (async () => {
      setBusy(true);
      try {
        await claimTshirtReward({
          fullName: fullName.trim(),
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          size,
        });
        await Promise.all([mutate(TSHIRT_REWARD_SWR_KEY), refreshAccess()]);
        toast.success(UI.tshirtClaimSuccess);
        onOpenChange(false);
        onClaimed?.();
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast.error(UI.tshirtClaimAlreadyDone);
        } else if (error instanceof ApiError && error.status === 403) {
          toast.error(UI.tshirtClaimNotEligible);
        } else {
          toast.error(UI.tshirtClaimError);
        }
      } finally {
        setBusy(false);
      }
    })();
  };

  const canSubmit =
    fullName.trim().length > 0 &&
    street.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length >= 3 &&
    country.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{UI.tshirtClaimTitle}</DialogTitle>
          <DialogDescription>{UI.tshirtClaimDescription}</DialogDescription>
        </DialogHeader>

        <TshirtRewardVisual highlight className="mb-2" />

        <div className="space-y-3 py-2">
          <Input
            id="tshirt-full-name"
            label={UI.tshirtClaimFullName}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <Input
            id="tshirt-street"
            label={UI.tshirtClaimStreet}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            autoComplete="street-address"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="tshirt-postal"
              label={UI.tshirtClaimPostalCode}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              autoComplete="postal-code"
            />
            <Input
              id="tshirt-city"
              label={UI.tshirtClaimCity}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
            />
          </div>
          <Input
            id="tshirt-country"
            label={UI.tshirtClaimCountry}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            autoComplete="country-name"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {UI.tshirtClaimSize}
            </label>
            <Select value={size} onValueChange={(v) => setSize(v as TshirtSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TSHIRT_SIZES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            disabled={busy || !canSubmit}
            onClick={handleSubmit}
          >
            {UI.tshirtClaimSubmit}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {UI.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
