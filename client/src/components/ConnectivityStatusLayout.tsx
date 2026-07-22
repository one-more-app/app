import { Button } from "@/components/ui/button";
import { useConnectivity } from "@/hooks/use-connectivity";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

type ConnectivityStatusLayoutProps = {
    icon: LucideIcon;
    title: string;
    hint: string;
    /** Teinte discrète de l'icône (accent maintenance, muted offline). */
    iconTone?: "muted" | "accent";
};

export function ConnectivityStatusLayout({
    icon: Icon,
    title,
    hint,
    iconTone = "muted",
}: ConnectivityStatusLayoutProps) {
    const { retry } = useConnectivity();
    const [retrying, setRetrying] = useState(false);

    return (
        <div className="flex min-h-screen-app flex-col items-center justify-center bg-background px-6 pt-safe-top">
            <div
                className={cn(
                    "flex w-full max-w-sm flex-col items-center gap-10   text-center",
                    "animate-in fade-in-0 slide-in-from-bottom-3 duration-400 [animation-fill-mode:both]",
                )}
            >
                <div
                    className={cn(
                        "flex size-14 items-center justify-center rounded-2xl",
                        iconTone === "accent" ? "bg-accent/15" : "bg-muted",
                    )}
                    aria-hidden
                >
                    <Icon
                        className={cn(
                            "size-7",
                            iconTone === "accent" ? "text-accent" : "text-muted-foreground",
                        )}
                        strokeWidth={1.75}
                    />
                </div>

                <div className="space-y-2">
                    <h1 className="font-one-more text-xl uppercase italic text-foreground">
                        {title}
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
                </div>

                <Button
                    type="button"
                    className="min-w-40"
                    disabled={retrying}
                    onClick={() => {
                        setRetrying(true);
                        void retry().finally(() => setRetrying(false));
                    }}
                >
                    <RefreshCw className={cn("size-4", retrying && "animate-spin")} aria-hidden />
                    {retrying ? UI.loading : UI.connectivityRetry}
                </Button>
            </div>
        </div>
    );
}
