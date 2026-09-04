import { cn } from "@/lib/utils";
import { UI } from "@/lib/translations";
import { useEffect, useState } from "react";

const WEIGHTS = [80, 85, 90, 95, 100];
const REPS = [3, 4, 5, 6, 5];
const TICK_MS = 320;

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
            setTick((current) => (current + 1) % WEIGHTS.length);
        }, TICK_MS);
        return () => window.clearInterval(id);
    }, [play]);

    const weight = WEIGHTS[tick] ?? 100;
    const reps = REPS[tick] ?? 5;
    const saved = tick === WEIGHTS.length - 1;

    return (
        <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border bg-card px-4 py-5 shadow-sm">
            <p className="mb-4 text-center text-sm font-medium capitalize text-foreground">
                {UI.onboardingIntroSceneExercise}
            </p>
            <div className="grid grid-cols-2 gap-3">
                <FakeWheel label={UI.weight} value={weight} unit="kg" />
                <FakeWheel label={UI.reps} value={reps} />
            </div>
            <div
                className={cn(
                    "mt-4 rounded-lg bg-primary px-3 py-2 text-center font-one-more text-xs uppercase tracking-wide text-primary-foreground transition-transform duration-200",
                    saved && "scale-105 bg-accent text-accent-foreground",
                )}
            >
                {UI.save}
            </div>
        </div>
    );
}

function FakeWheel({
    label,
    value,
    unit,
}: {
    label: string;
    value: number;
    unit?: string;
}) {
    return (
        <div className="rounded-xl bg-muted/50 px-2 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="font-one-more text-3xl font-bold italic tabular-nums">
                {value}
            </p>
            {unit ? (
                <p className="text-xs text-muted-foreground">{unit}</p>
            ) : null}
        </div>
    );
}
