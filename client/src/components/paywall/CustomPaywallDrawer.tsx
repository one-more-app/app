import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePaywall } from "@/hooks/use-paywall";
import { AnalyticsEvents } from "@/lib/analytics";
import { UI } from "@/lib/translations";
import {
    getCurrentOffering,
    purchasePackage,
    type CurrentOffering,
} from "@/lib/purchases";
import { cn } from "@/lib/utils";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type PurchasesPackage =
    import("@revenuecat/purchases-capacitor").PurchasesPackage;

type SelectedKey = "annual" | "monthly";

const SUPPORT_URL = "mailto:admin@one-more.app";
const PRIVACY_URL = "https://one-more.app/privacy";
const TERMS_URL = "https://one-more.app/terms";

const FALLBACK_ANNUAL_OLD_PRICE = "59,99€";

function pickString(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
): string | null {
    if (!metadata) return null;
    const value = metadata[key];
    return typeof value === "string" && value.length > 0 ? value : null;
}

function pickBoolean(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
    fallback: boolean,
): boolean {
    if (!metadata) return fallback;
    const value = metadata[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        if (/^(true|1|yes)$/i.test(value)) return true;
        if (/^(false|0|no)$/i.test(value)) return false;
    }
    return fallback;
}

function formatPricePerMonth(pkg: PurchasesPackage): string {
    const product = pkg.product;
    if (typeof product.pricePerMonthString === "string") {
        return product.pricePerMonthString;
    }
    if (typeof product.pricePerMonth === "number") {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: product.currencyCode ?? "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(product.pricePerMonth);
    }
    return product.priceString;
}

// Sépare le préfixe/suffixe de devise du nombre pour appliquer uniformément
// la police One More sur toute la chaîne (les glyphes manquants dans le woff2
// tombent naturellement sur la fallback italic bold sans casser le rendu).
function parsePrice(priceString: string): {
    prefix: string;
    number: string;
    suffix: string;
} {
    const match = priceString.match(/^([^\d]*)([\d\s.,\u00a0]+)([^\d]*)$/);
    if (!match) return { prefix: "", number: priceString, suffix: "" };
    return {
        prefix: match[1] ?? "",
        number: match[2] ?? "",
        suffix: match[3] ?? "",
    };
}

function Price({
    value,
    className,
    strike = false,
}: {
    value: string;
    className?: string;
    strike?: boolean;
}) {
    const { prefix, number, suffix } = parsePrice(value);
    return (
        <span
            className={cn(
                "font-one-more italic",
                strike && "line-through",
                className,
            )}
        >
            {prefix ? <span>{prefix}</span> : null}
            <span>{number}</span>
            {suffix ? <span>{suffix}</span> : null}
        </span>
    );
}

async function openExternal(url: string) {
    if (Capacitor.isNativePlatform() && !url.startsWith("mailto:")) {
        try {
            await Browser.open({ url });
            return;
        } catch {
            // ignore, fallback to window.open
        }
    }
    if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

export function CustomPaywallDrawer() {
    const { open, source, resolvePaywall } = usePaywall();
    const { track } = useAnalytics();

    const [offering, setOffering] = useState<CurrentOffering | null>(null);
    const [hasError, setHasError] = useState(false);
    const [selected, setSelected] = useState<SelectedKey>("annual");
    const [purchasing, setPurchasing] = useState(false);

    const status: "loading" | "error" | "ready" = hasError
        ? "error"
        : offering
          ? "ready"
          : "loading";

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        void (async () => {
            try {
                const result = await getCurrentOffering();
                if (cancelled) return;
                if (!result) {
                    setHasError(true);
                    return;
                }
                setOffering(result);
                track(AnalyticsEvents.PAYWALL_VIEWED, {
                    paywall_type: "custom",
                    source: source ?? "unknown",
                    offering: result.offering.identifier,
                });
            } catch {
                if (cancelled) return;
                setHasError(true);
            }
        })();
        return () => {
            cancelled = true;
            setOffering(null);
            setHasError(false);
            setSelected("annual");
        };
    }, [open, source, track]);

    const metadata = (offering?.offering.metadata ?? null) as
        | Record<string, unknown>
        | null;

    const annualOldPrice =
        pickString(metadata, "annualOldPrice") ?? FALLBACK_ANNUAL_OLD_PRICE;
    const showTshirtsSection = pickBoolean(
        metadata,
        "showTshirtsSection",
        true,
    );

    const packages = useMemo(
        () => ({
            annual: offering?.annual ?? null,
            monthly: offering?.monthly ?? null,
        }),
        [offering],
    );

    const selectedPackage = packages[selected] ?? null;
    const isAnnualSelected = selected === "annual";

    const handleClose = () => {
        if (purchasing) return;
        resolvePaywall(false);
    };

    const handleSelect = (key: SelectedKey) => {
        if (!packages[key]) return;
        setSelected(key);
    };

    const handlePurchase = async () => {
        if (!selectedPackage || purchasing) return;
        setPurchasing(true);
        track(AnalyticsEvents.PURCHASE_STARTED, {
            source: source ?? "unknown",
            package: selectedPackage.identifier,
            package_type: selectedPackage.packageType,
        });
        try {
            const outcome = await purchasePackage(selectedPackage);
            if (outcome === "purchased") {
                track(AnalyticsEvents.PURCHASE_VALIDATED, {
                    source: source ?? "unknown",
                    package: selectedPackage.identifier,
                    package_type: selectedPackage.packageType,
                });
                toast.success(UI.premiumSubscribeSuccess);
                resolvePaywall(true);
            } else if (outcome === "error") {
                track(AnalyticsEvents.PURCHASE_FAILED, {
                    source: source ?? "unknown",
                    package: selectedPackage.identifier,
                });
                toast.error(UI.premiumSubscribeError);
            }
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => {
                if (!next) handleClose();
            }}
            data-analytics-label="paywall"
        >
            <DrawerContent
                className={cn(
                    "data-[vaul-drawer-direction=bottom]:max-h-[95vh]",
                    "overflow-hidden bg-black text-white",
                    // Repositionne la poignée Vaul (premier enfant) par-dessus
                    // le hero pour que l'image touche vraiment le haut du drawer.
                    "[&>div:first-child]:absolute [&>div:first-child]:left-1/2",
                    "[&>div:first-child]:top-2 [&>div:first-child]:z-30",
                    "[&>div:first-child]:-translate-x-1/2",
                    "[&>div:first-child]:!mt-0 [&>div:first-child]:!bg-white/70",
                )}
            >
                <button
                    type="button"
                    aria-label={UI.paywallClose}
                    onClick={handleClose}
                    disabled={purchasing}
                    className={cn(
                        "absolute right-4 top-4 z-30 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-95",
                        "disabled:opacity-50",
                    )}
                >
                    <X className="size-5" />
                </button>

                <div className="flex-1 overflow-y-auto">
                    {status === "loading" ? (
                        <PaywallLoading />
                    ) : status === "error" || !offering ? (
                        <PaywallError onRetry={handleClose} />
                    ) : (
                        <PaywallBody
                            annual={packages.annual}
                            monthly={packages.monthly}
                            selected={selected}
                            onSelect={handleSelect}
                            annualOldPrice={annualOldPrice}
                            showTshirtsSection={showTshirtsSection}
                            isAnnualSelected={isAnnualSelected}
                            onPurchase={handlePurchase}
                            purchasing={purchasing}
                            selectedPackage={selectedPackage}
                        />
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function PaywallLoading() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-white/80">
            <Loader2 className="size-6 animate-spin" />
            <p className="text-sm">{UI.paywallLoading}</p>
        </div>
    );
}

function PaywallError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center text-white/80">
            <p className="text-sm">{UI.paywallError}</p>
            <Button
                variant="outline"
                onClick={onRetry}
                className="bg-transparent text-white"
            >
                {UI.paywallClose}
            </Button>
        </div>
    );
}

type PaywallBodyProps = {
    annual: PurchasesPackage | null;
    monthly: PurchasesPackage | null;
    selected: SelectedKey;
    onSelect: (key: SelectedKey) => void;
    annualOldPrice: string;
    showTshirtsSection: boolean;
    isAnnualSelected: boolean;
    onPurchase: () => void;
    purchasing: boolean;
    selectedPackage: PurchasesPackage | null;
};

function PaywallBody({
    annual,
    monthly,
    selected,
    onSelect,
    annualOldPrice,
    showTshirtsSection,
    isAnnualSelected,
    onPurchase,
    purchasing,
    selectedPackage,
}: PaywallBodyProps) {
    return (
        <div className="flex flex-col">
            <div className="relative">
                <img
                    src="/images/marcus.png"
                    alt=""
                    className="w-full select-none object-cover"
                    style={{ aspectRatio: "16 / 9" }}
                    draggable={false}
                />
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent"
                    aria-hidden
                />
            </div>

            <div className="relative z-10 -mt-6 flex flex-col gap-4 px-5 pb-5">
                <h1 className="font-one-more text-2xl uppercase italic tracking-tight text-white">
                    {UI.paywallTitle}
                </h1>

                <section className="space-y-2">
                    <p className="text-sm font-semibold text-white">
                        {UI.paywallIncludedTitle}
                    </p>
                    <ul className="space-y-1.5">
                        <PaywallCheckLine label={UI.paywallIncludedNoLimit} />
                        <PaywallCheckLine label={UI.paywallIncludedFuture} />
                    </ul>
                </section>

                {showTshirtsSection ? (
                    <ConditionalTshirtsSection open={isAnnualSelected} />
                ) : null}

                <section className="relative flex flex-col gap-2.5">
                    {annual ? (
                        <PackageCard
                            label={UI.paywallAnnualLabel}
                            perMonth={
                                <>
                                    1 mois{" "}
                                    <Price
                                        value={formatPricePerMonth(annual)}
                                    />
                                </>
                            }
                            oldPrice={annualOldPrice}
                            price={annual.product.priceString}
                            trailingLabel={UI.paywallFirstYear}
                            badge={UI.paywallGiftBadge}
                            selected={selected === "annual"}
                            onSelect={() => onSelect("annual")}
                        />
                    ) : null}

                    {monthly ? (
                        <PackageCard
                            label={UI.paywallMonthlyLabel}
                            perMonth={
                                <>
                                    1 mois{" "}
                                    <Price
                                        value={monthly.product.priceString}
                                    />
                                </>
                            }
                            price={monthly.product.priceString}
                            trailingLabel={UI.paywallPerMonthLabel}
                            selected={selected === "monthly"}
                            onSelect={() => onSelect("monthly")}
                        />
                    ) : null}
                </section>

                <Button
                    variant="accent"
                    size="lg"
                    className="w-full text-base"
                    disabled={purchasing || !selectedPackage}
                    onClick={onPurchase}
                >
                    {purchasing ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        UI.paywallCta
                    )}
                </Button>

                <p className="text-center text-xs text-white/70">
                    {selectedPackage ? (
                        <BilledLine
                            selectedPackage={selectedPackage}
                            annual={isAnnualSelected}
                        />
                    ) : null}
                </p>

                <PaywallFooterLinks />
            </div>
        </div>
    );
}

function BilledLine({
    selectedPackage,
    annual,
}: {
    selectedPackage: PurchasesPackage;
    annual: boolean;
}) {
    const template = annual
        ? UI.paywallBilledYearly
        : UI.paywallBilledMonthly;
    const [before, after] = template.split("{price}");
    return (
        <span>
            {before}
            <Price value={selectedPackage.product.priceString} />
            {after}
        </span>
    );
}

function PaywallCheckLine({ label }: { label: string }) {
    return (
        <li className="flex items-start gap-2 text-sm text-white/90">
            <Check className="mt-0.5 size-4 shrink-0" />
            <span>{label}</span>
        </li>
    );
}

function ConditionalTshirtsSection({ open }: { open: boolean }) {
    return (
        <div
            className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
            aria-hidden={!open}
        >
            <div className="min-h-0 overflow-hidden">
                <section className="flex items-start gap-3">
                    <div className="flex flex-1 flex-col gap-2">
                        <p className="text-sm font-semibold text-white">
                            {UI.paywallAnnualSpecialTitle}
                        </p>
                        <div className="flex items-start gap-2 text-sm text-white/90">
                            <Check className="mt-0.5 size-4 shrink-0" />
                            <span>{UI.paywallAnnualTshirts}</span>
                        </div>
                        <p className="pl-6 text-xs leading-snug text-white/50">
                            {UI.paywallAnnualTshirtsFineprint}
                        </p>
                    </div>
                    <img
                        src="/images/abonnement mensual t shirts.png"
                        alt=""
                        className="w-24 shrink-0 self-center select-none object-contain sm:w-28"
                        draggable={false}
                    />
                </section>
            </div>
        </div>
    );
}

type PackageCardProps = {
    label: string;
    perMonth: ReactNode;
    price: string;
    oldPrice?: string;
    trailingLabel: string;
    badge?: string;
    selected: boolean;
    onSelect: () => void;
};

function PackageCard({
    label,
    perMonth,
    price,
    oldPrice,
    trailingLabel,
    badge,
    selected,
    onSelect,
}: PackageCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                "relative flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-3 text-left text-black transition",
                selected
                    ? "shadow-[0_0_0_3px_#0a0a0a,0_12px_28px_-10px_color-mix(in_oklab,var(--accent)_55%,transparent)]"
                    : "shadow-[0_0_0_1px_rgba(0,0,0,0.06)]",
                "active:scale-[0.99]",
            )}
        >
            {badge ? (
                <span className="absolute -top-2.5 right-3 rounded-md bg-[color:var(--accent)] px-2 py-0.5 font-one-more text-[10px] italic uppercase tracking-wide text-black">
                    {badge}
                </span>
            ) : null}

            <RadioDot selected={selected} />

            <div className="flex flex-1 items-center justify-between gap-3">
                <div className="flex flex-col">
                    <span className="text-base font-semibold">{label}</span>
                    <span className="text-xs text-black/60">{perMonth}</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1.5">
                        {oldPrice ? (
                            <Price
                                value={oldPrice}
                                strike
                                className="text-sm text-black/40"
                            />
                        ) : null}
                        <Price
                            value={price}
                            className="text-base font-semibold"
                        />
                    </div>
                    <span className="text-xs text-black/60">{trailingLabel}</span>
                </div>
            </div>
        </button>
    );
}

function RadioDot({ selected }: { selected: boolean }) {
    return (
        <span
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition",
                selected
                    ? "border-black bg-black"
                    : "border-black/40 bg-transparent",
            )}
            aria-hidden
        >
            {selected ? (
                <span className="size-2 rounded-full bg-white" />
            ) : null}
        </span>
    );
}

function PaywallFooterLinks() {
    return (
        <div className="flex items-center justify-center gap-3 pt-1 text-xs text-white/60">
            <button
                type="button"
                onClick={() => void openExternal(SUPPORT_URL)}
                className="transition hover:text-white"
            >
                {UI.paywallSupport}
            </button>
            <span className="text-white/30">·</span>
            <button
                type="button"
                onClick={() => void openExternal(PRIVACY_URL)}
                className="transition hover:text-white"
            >
                {UI.paywallPrivacy}
            </button>
            <span className="text-white/30">·</span>
            <button
                type="button"
                onClick={() => void openExternal(TERMS_URL)}
                className="transition hover:text-white"
            >
                {UI.paywallTerms}
            </button>
        </div>
    );
}
