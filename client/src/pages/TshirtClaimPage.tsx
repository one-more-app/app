import { AddressSearchPicker } from "@/components/addresses/AddressSearchPicker";
import { TshirtRewardVisual } from "@/components/profile/TshirtRewardVisual";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAccess } from "@/hooks/use-access";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useAuth } from "@/hooks/use-auth";
import type { AddressDetails } from "@/lib/addresses-api";
import { ApiError } from "@/lib/api";
import { resolveProfileName } from "@/lib/profile-display";
import {
    claimTshirtReward,
    TSHIRT_REWARD_SWR_KEY,
    TSHIRT_SIZES,
    type TshirtRewardType,
    type TshirtSize,
} from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import { isTshirtRewardType } from "@/lib/tshirt-claim-route";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { mutate } from "swr";

function SizeChoice({
    value,
    onChange,
}: {
    value: TshirtSize | "";
    onChange: (value: TshirtSize) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{UI.tshirtClaimSize}</p>
                <p className="text-sm text-muted-foreground">{UI.tshirtClaimUnisexHint}</p>
            </div>
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

    const profileFullName = useMemo(() => {
        if (!profile) return "";
        return resolveProfileName(profile, auth.user).fullName ?? "";
    }, [auth.user, profile]);

    const [fullNameOverride, setFullNameOverride] = useState<string | null>(null);
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("France");
    const [size, setSize] = useState<TshirtSize | "">("");
    const [busy, setBusy] = useState(false);

    const fullName = fullNameOverride ?? profileFullName;

    const handleAddressSelected = (details: AddressDetails) => {
        setStreet(details.street?.trim() || details.label);
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
        size !== "";

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
            <header className="sticky-top-safe z-100 border-b border-border bg-background px-4 py-4">
                <div className="mx-auto max-w-lg space-y-1">
                    <h1 className="text-md font-one-more uppercase italic">
                        {UI.tshirtClaimTitle}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {UI.tshirtClaimDescription}
                    </p>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-5 pb-10">
                <section className="flex flex-col items-center gap-3 rounded-xl bg-card px-3 py-3">
                    <TshirtRewardVisual
                        rewardType={rewardType}
                        showSlogan={false}
                    />
                    <p className="text-center text-sm text-muted-foreground">
                        {rewardLabel}
                    </p>
                </section>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>
                            {UI.tshirtClaimDeliveryFormTitle}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            id="tshirt-full-name"
                            label={UI.tshirtClaimFullName}
                            value={fullName}
                            onChange={(e) => setFullNameOverride(e.target.value)}
                            autoComplete="name"
                        />

                        <AddressSearchPicker
                            value={street}
                            onChange={setStreet}
                            onAddressSelected={handleAddressSelected}
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

                        <SizeChoice value={size} onChange={setSize} />
                    </CardContent>
                </Card>

                <Button
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
