import { AddressSearchPicker } from "@/components/addresses/AddressSearchPicker";
import { BackHeader } from "@/components/BackHeader";
import { TshirtRewardVisual } from "@/components/profile/TshirtRewardVisual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAccess } from "@/hooks/use-access";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import type { AddressDetails } from "@/lib/addresses-api";
import { resolveProfileName } from "@/lib/profile-display";
import {
  claimTshirtReward,
  TSHIRT_REWARD_SWR_KEY,
  TSHIRT_SIZES,
  type TshirtGender,
  type TshirtRewardType,
  type TshirtSize,
} from "@/lib/rewards-api";
import { isTshirtRewardType } from "@/lib/tshirt-claim-route";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Loader2, Mars, Venus } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { mutate } from "swr";

function GenderChoice({
  value,
  onChange,
}: {
  value: TshirtGender | "";
  onChange: (value: TshirtGender) => void;
}) {
  const choices: {
    id: TshirtGender;
    label: string;
    Icon: typeof Mars;
  }[] = [
    { id: "male", label: UI.male, Icon: Mars },
    { id: "female", label: UI.female, Icon: Venus },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{UI.tshirtClaimGender}</p>
      <div
        className="grid grid-cols-2 gap-3"
        role="radiogroup"
        aria-label={UI.gender}
      >
        {choices.map(({ id, label, Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all",
                selected
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-muted/20 text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SizeChoice({
  value,
  onChange,
}: {
  value: TshirtSize | "";
  onChange: (value: TshirtSize) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{UI.tshirtClaimSize}</p>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (TSHIRT_SIZES.includes(next as TshirtSize)) {
            onChange(next as TshirtSize);
          }
        }}
        variant="outline"
        className="grid w-full grid-cols-3 gap-2 rounded-xl border border-border/80 bg-muted/20 p-1 sm:grid-cols-6"
      >
        {TSHIRT_SIZES.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            aria-label={option}
            className="h-10 w-full rounded-lg data-[state=on]:shadow-none"
          >
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export function TshirtClaimPage() {
  const { rewardType: rewardTypeParam } = useParams<{ rewardType: string }>();
  const rewardType = isTshirtRewardType(rewardTypeParam)
    ? rewardTypeParam
    : null;
  const navigate = useNavigate();
  const auth = useAuth();
  const { data: profile } = useUserProfileData();
  const { refresh: refreshAccess } = useAccess();

  const profileDefaults = useMemo(() => {
    if (!profile) {
      return { fullName: "", gender: "" as TshirtGender | "" };
    }
    const resolved = resolveProfileName(profile, auth.user);
    return {
      fullName: resolved.fullName ?? "",
      gender:
        profile.gender === "male" || profile.gender === "female"
          ? profile.gender
          : ("" as TshirtGender | ""),
    };
  }, [auth.user, profile]);

  const [fullNameOverride, setFullNameOverride] = useState<string | null>(null);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("France");
  const [size, setSize] = useState<TshirtSize | "">("");
  const [genderOverride, setGenderOverride] = useState<TshirtGender | null>(null);
  const [busy, setBusy] = useState(false);

  const fullName = fullNameOverride ?? profileDefaults.fullName;
  const gender = genderOverride ?? profileDefaults.gender;

  const handleAddressSelected = (details: AddressDetails) => {
    setStreet(details.street ?? "");
    setCity(details.city ?? "");
    setPostalCode(details.postalCode ?? "");
    setCountry(details.country ?? "France");
  };

  if (!rewardType) {
    return <Navigate to="/home" replace />;
  }

  const rewardLabel =
    rewardType === "annual_classic_pack"
      ? UI.tshirtClaimAnnualRewardLabel
      : UI.tshirtClaimReferralRewardLabel;

  const canSubmit =
    fullName.trim().length > 0 &&
    street.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length >= 3 &&
    country.trim().length > 0 &&
    size !== "" &&
    gender !== "";

  const handleSubmit = () => {
    if (!canSubmit || busy) return;

    void (async () => {
      setBusy(true);
      try {
        await claimTshirtReward({
          rewardType: rewardType as TshirtRewardType,
          fullName: fullName.trim(),
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          size,
          gender,
        });
        await Promise.all([mutate(TSHIRT_REWARD_SWR_KEY), refreshAccess()]);
        toast.success(UI.tshirtClaimSuccess);
        navigate("/home", { replace: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast.error(UI.tshirtClaimAlreadyDone);
          navigate("/home", { replace: true });
        } else if (error instanceof ApiError && error.status === 403) {
          toast.error(UI.tshirtClaimNotEligible);
          navigate("/home", { replace: true });
        } else {
          toast.error(UI.tshirtClaimError);
        }
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <div className="min-h-screen-app bg-background">
      <BackHeader
        title={UI.tshirtClaimTitle}
        description={UI.tshirtClaimDescription}
      />

      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-4 pb-10">
        <TshirtRewardVisual highlight />

        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {UI.tshirtClaimMandatoryHint}
        </p>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {rewardLabel}
            </p>

            <Input
              id="tshirt-full-name"
              label={UI.tshirtClaimFullName}
              value={fullName}
              onChange={(e) => setFullNameOverride(e.target.value)}
              autoComplete="name"
            />

            <AddressSearchPicker onAddressSelected={handleAddressSelected} />

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

            <GenderChoice value={gender} onChange={setGenderOverride} />
            <SizeChoice value={size} onChange={setSize} />
          </CardContent>
        </Card>

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={busy || !canSubmit}
          onClick={handleSubmit}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : UI.tshirtClaimSubmit}
        </Button>
      </main>
    </div>
  );
}
