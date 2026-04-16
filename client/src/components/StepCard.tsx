import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function StepCard(props: {
    title: string;
    stepLabel?: string;
    progressPercent?: number;
    onBack?: () => void;
    backLabel?: string;
    animated?: boolean;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
}) {
    const {
        title,
        stepLabel,
        progressPercent,
        onBack,
        backLabel = "Retour",
        animated = false,
        children,
        className,
        headerClassName,
        contentClassName,
    } = props;

    return (
        <Card
            className={cn(
                "w-full",
                animated &&
                "animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
                className,
            )}
        >
            <CardHeader className={cn("space-y-1", headerClassName)}>
                {onBack || stepLabel ? (
                    <div className="flex items-center gap-2">
                        {onBack ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 -ml-2"
                                onClick={onBack}
                                aria-label={backLabel}
                            >
                                <ArrowLeft className="size-5" />
                            </Button>
                        ) : null}
                        {stepLabel ? (
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {stepLabel}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {typeof progressPercent === "number" ? (
                    <Progress
                        value={Math.max(0, Math.min(100, progressPercent))}
                        className="h-1.5"
                    />
                ) : null}

                <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent className={cn("space-y-6 pt-1", contentClassName)}>
                {children}
            </CardContent>
        </Card>
    );
}

