import { OnboardingDemoExerciseHeader, OnboardingSceneStage } from "@/components/onboarding/OnboardingSceneStage";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const WEIGHTS = [80, 85, 90, 95, 100];
const ITEM_WIDTH = 44;
const TICK_MS = 280;

type OnboardingSceneLogPerfProps = {
    active: boolean;
    reduceMotion: boolean;
};

export function OnboardingSceneLogPerf({
    active,
    reduceMotion,
}: OnboardingSceneLogPerfProps) {
    const play = active && !reduceMotion;
    const [tick, setTick] = useState(WEIGHTS.length - 1);

    useEffect(() => {
        if (!play) {
            setTick(WEIGHTS.length - 1);
            return;
        }
        setTick(0);
        const id = window.setInterval(() => {
            setTick((current) => {
                if (current >= WEIGHTS.length - 1) {
                    window.clearInterval(id);
                    return current;
                }
                return current + 1;
            });
        }, TICK_MS);
        return () => window.clearInterval(id);
    }, [play]);

    const weight = WEIGHTS[tick] ?? 100;
    const saved = tick === WEIGHTS.length - 1;
    const shownWeight = saved ? 100 : 90;
    const shownRecord = saved ? 100 : 90;

    return (
        <OnboardingSceneStage>
            <OnboardingDemoExerciseHeader
                lastWeight={shownWeight}
                lastReps={5}
                recordWeight={shownRecord}
                recordReps={5}
            />

            <div
                className={cn(
                    "absolute inset-0 bg-black/50",
                    play && "animate-in fade-in-0 duration-300 ease-out [animation-fill-mode:both]",
                )}
            />

            <div
                className={cn(
                    "absolute inset-x-0 bottom-0 rounded-t-lg border-t bg-background pb-3",
                    play &&
                        "animate-in fade-in-0 slide-in-from-bottom-8 duration-400 ease-out [animation-fill-mode:both]",
                )}
            >
                <div className="bg-muted mx-auto mt-3 h-2 w-[100px] rounded-full" />
                <div className="space-y-3 px-4 pt-3">
                    <p className="text-center font-one-more text-sm uppercase italic text-foreground">
                        {UI.newPerf}
                    </p>
                    <DemoWheel
                        label={`${UI.weight} (kg)`}
                        value={weight}
                        options={WEIGHTS}
                    />
                    <DemoWheel
                        label={UI.reps}
                        value={5}
                        options={[3, 4, 5, 6, 7]}
                    />
                    <Button
                        type="button"
                        className={cn(
                            "w-full",
                            saved && "celebration-count-anim bg-accent text-accent-foreground",
                        )}
                        tabIndex={-1}
                        haptic={false}
                    >
                        {UI.save}
                    </Button>
                </div>
            </div>
        </OnboardingSceneStage>
    );
}

function DemoWheel({
    label,
    value,
    options,
}: {
    label: string;
    value: number;
    options: number[];
}) {
    const index = Math.max(0, options.indexOf(value));
    const offset = index * ITEM_WIDTH;

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">
                {label}
            </span>
            <div className="flex w-full items-center gap-1.5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Minus className="size-4" aria-hidden />
                </span>
                <div className="relative min-w-0 flex-1 font-one-more">
                    <div
                        className="flex h-11 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
                    >
                        <div
                            className="flex transition-transform duration-200 ease-out"
                            style={{
                                transform: `translateX(calc(50% - ${offset + ITEM_WIDTH / 2}px))`,
                            }}
                        >
                            {options.map((opt) => (
                                <div
                                    key={opt}
                                    className={cn(
                                        "flex shrink-0 items-center justify-center font-semibold tabular-nums",
                                        opt === value
                                            ? "text-transparent text-lg"
                                            : "text-muted-foreground/50 text-sm",
                                    )}
                                    style={{ width: ITEM_WIDTH, height: 44 }}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <span className="flex h-10 w-[4.5rem] items-center justify-center rounded-xl border border-border/70 bg-secondary text-lg font-semibold tabular-nums shadow-sm">
                            {value}
                        </span>
                    </div>
                </div>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Plus className="size-4" aria-hidden />
                </span>
            </div>
        </div>
    );
}
