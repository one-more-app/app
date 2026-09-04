import { ExercisePerfStats } from "@/components/ExercisePerfStats";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function OnboardingSceneStage({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "relative h-full min-h-0 overflow-hidden rounded-2xl border bg-background shadow-sm",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function OnboardingDemoExerciseHeader({
    lastWeight,
    lastReps,
    recordWeight,
    recordReps,
}: {
    lastWeight: number;
    lastReps: number;
    recordWeight: number;
    recordReps: number;
}) {
    return (
        <div className="space-y-2.5 px-3 pt-3">
            <p className="font-one-more text-lg font-semibold uppercase italic leading-tight tracking-tight">
                {UI.onboardingIntroSceneExercise}
            </p>
            <ExercisePerfStats
                lastPerf={{ weight: lastWeight, reps: lastReps }}
                personalBest={{ weight: recordWeight, reps: recordReps }}
            />
        </div>
    );
}
