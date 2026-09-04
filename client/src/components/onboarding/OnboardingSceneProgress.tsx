import {
    OnboardingDemoExerciseHeader,
    OnboardingSceneStage,
} from "@/components/onboarding/OnboardingSceneStage";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";

const CHART_DATA = [
    { date: "12 janv.", weight: 80 },
    { date: "28 janv.", weight: 85 },
    { date: "9 févr.", weight: 90 },
    { date: "2 mars", weight: 95 },
    { date: "18 mars", weight: 100 },
];

const REVEAL_MS = 420;

type OnboardingSceneProgressProps = {
    active: boolean;
    reduceMotion: boolean;
};

export function OnboardingSceneProgress({
    active,
    reduceMotion,
}: OnboardingSceneProgressProps) {
    const play = active && !reduceMotion;
    const [count, setCount] = useState(CHART_DATA.length);

    useEffect(() => {
        if (!play) {
            setCount(CHART_DATA.length);
            return;
        }
        setCount(1);
        const id = window.setInterval(() => {
            setCount((current) => {
                if (current >= CHART_DATA.length) {
                    window.clearInterval(id);
                    return current;
                }
                return current + 1;
            });
        }, REVEAL_MS);
        return () => window.clearInterval(id);
    }, [play]);

    const data = CHART_DATA.slice(0, count);
    const last = data[data.length - 1];
    const lineColor = "var(--primary)";
    const gridColor = "var(--border)";
    const tickColor = "var(--muted-foreground)";

    return (
        <OnboardingSceneStage>
            <OnboardingDemoExerciseHeader
                lastWeight={last?.weight ?? 100}
                lastReps={5}
                recordWeight={100}
                recordReps={5}
            />
            <div className="relative mx-3 mb-3 mt-2 h-[min(42%,11rem)] min-h-[7.5rem]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: tickColor, fontSize: 11 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={{ stroke: gridColor }}
                        />
                        <YAxis
                            dataKey="weight"
                            unit=" kg"
                            domain={[75, 105]}
                            tick={{ fill: tickColor, fontSize: 11 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={{ stroke: gridColor }}
                            width={42}
                        />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            stroke={lineColor}
                            strokeWidth={2.5}
                            isAnimationActive={play}
                            animationDuration={350}
                            animationEasing="ease-out"
                            dot={(props: unknown) => {
                                const { cx, cy, payload, index } = props as {
                                    cx?: number;
                                    cy?: number;
                                    payload: { weight: number };
                                    index?: number;
                                };
                                if (cx == null || cy == null) return <g />;
                                const isLast =
                                    index === data.length - 1 &&
                                    payload.weight === 100;
                                return (
                                    <g key={`${payload.weight}-${index ?? 0}`}>
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={isLast ? 5 : 3.5}
                                            fill={
                                                isLast
                                                    ? "var(--accent)"
                                                    : lineColor
                                            }
                                            stroke={
                                                isLast
                                                    ? "var(--background)"
                                                    : undefined
                                            }
                                            strokeWidth={isLast ? 2 : 0}
                                        />
                                    </g>
                                );
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
                {last?.weight === 100 ? (
                    <p
                        className={cn(
                            "absolute right-2 top-1 rounded-md bg-accent px-1.5 py-0.5 font-one-more text-[10px] uppercase italic text-accent-foreground",
                            play &&
                                "animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out [animation-fill-mode:both]",
                        )}
                    >
                        {UI.record}
                    </p>
                ) : null}
            </div>
        </OnboardingSceneStage>
    );
}
