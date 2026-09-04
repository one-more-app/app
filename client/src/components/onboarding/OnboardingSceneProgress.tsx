import { cn } from "@/lib/utils";

const POINTS = [
    { x: 12, y: 78 },
    { x: 32, y: 62 },
    { x: 52, y: 48 },
    { x: 72, y: 32 },
    { x: 88, y: 18 },
] as const;

const POLYLINE = POINTS.map((p) => `${p.x},${p.y}`).join(" ");

type OnboardingSceneProgressProps = {
    active: boolean;
    reduceMotion: boolean;
};

export function OnboardingSceneProgress({
    active,
    reduceMotion,
}: OnboardingSceneProgressProps) {
    const animate = active && !reduceMotion;

    return (
        <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border bg-card px-3 py-4 shadow-sm">
            <svg
                viewBox="0 0 100 100"
                className="mx-auto h-full max-h-44 w-full"
                aria-hidden
            >
                <line
                    x1="8"
                    y1="88"
                    x2="94"
                    y2="88"
                    className="stroke-border"
                    strokeWidth="1.5"
                />
                <line
                    x1="8"
                    y1="12"
                    x2="8"
                    y2="88"
                    className="stroke-border"
                    strokeWidth="1.5"
                />
                <polyline
                    fill="none"
                    points={POLYLINE}
                    className={cn(
                        "stroke-primary",
                        animate && "onboarding-intro-chart",
                    )}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={
                        animate
                            ? { strokeDasharray: 160, strokeDashoffset: 160 }
                            : undefined
                    }
                />
                {POINTS.map((point, index) => {
                    const last = index === POINTS.length - 1;
                    return (
                        <circle
                            key={`${point.x}-${point.y}`}
                            cx={point.x}
                            cy={point.y}
                            r={last ? 3.4 : 2.2}
                            className={cn(
                                last ? "fill-accent" : "fill-primary",
                                animate &&
                                    "animate-in fade-in-0 slide-in-from-bottom-1 duration-300",
                            )}
                            style={
                                animate
                                    ? { animationDelay: `${180 + index * 140}ms` }
                                    : undefined
                            }
                        />
                    );
                })}
            </svg>
        </div>
    );
}
