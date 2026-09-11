import { OnboardingSceneLeaguePromo, ONBOARDING_SCENE_LEAGUE_PROMO_MS } from "@/components/onboarding/OnboardingSceneLeaguePromo";
import {
    ONBOARDING_SCENE_LOG_PERF_MS,
    OnboardingSceneLogPerf,
} from "@/components/onboarding/OnboardingSceneLogPerf";
import {
    ONBOARDING_SCENE_PROGRESS_MS,
    OnboardingSceneProgress,
} from "@/components/onboarding/OnboardingSceneProgress";
import {
    trackOnboardingStepViewed,
    type OnboardingFeatureSlideId,
    type OnboardingStepId,
} from "@/lib/analytics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type SceneOpts = {
    active: boolean;
    reduceMotion: boolean;
};

type Slide = {
    id: OnboardingFeatureSlideId;
    title: string;
    body: string;
    durationMs: number;
    holdMs?: number;
    scene: (opts: SceneOpts) => ReactNode;
};

const REDUCED_MOTION_SLIDE_MS = 2500;
/** Pause par défaut après la fin de l'animation avant la slide suivante. */
const SLIDE_HOLD_MS = 500;
/** Pause plus longue pour la slide graphique de progression. */
const SLIDE_PROGRESS_HOLD_MS = 1200;

const SLIDES: Slide[] = [
    {
        id: "log",
        title: UI.onboardingIntroSlide1Title,
        body: UI.onboardingIntroSlide1Body,
        durationMs: ONBOARDING_SCENE_LOG_PERF_MS,
        scene: (opts) => <OnboardingSceneLogPerf {...opts} />,
    },
    {
        id: "record",
        title: UI.onboardingIntroSlide2Title,
        body: UI.onboardingIntroSlide2Body,
        durationMs: ONBOARDING_SCENE_LEAGUE_PROMO_MS,
        scene: (opts) => <OnboardingSceneLeaguePromo {...opts} />,
    },
    {
        id: "progress",
        title: UI.onboardingIntroSlide3Title,
        body: UI.onboardingIntroSlide3Body,
        durationMs: ONBOARDING_SCENE_PROGRESS_MS,
        holdMs: SLIDE_PROGRESS_HOLD_MS,
        scene: (opts) => <OnboardingSceneProgress {...opts} />,
    },
];

/** Slides + clone de la 1re pour une boucle infinie vers l'avant. */
const LOOP_SLIDES: Slide[] = [...SLIDES, SLIDES[0]];

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() =>
        typeof window === "undefined"
            ? false
            : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setReduced(media.matches);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    return reduced;
}

type OnboardingFeatureSliderProps = {
    /** Step analytics (`intro` ou `pre_registration`). */
    analyticsStep: OnboardingStepId;
};

export function OnboardingFeatureSlider({
    analyticsStep,
}: OnboardingFeatureSliderProps) {
    const reduceMotion = usePrefersReducedMotion();
    const [trackIndex, setTrackIndex] = useState(0);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const programmaticScrollRef = useRef(false);
    const loopResettingRef = useRef(false);
    const seenSlidesRef = useRef(new Set<OnboardingFeatureSlideId>());

    const logicalIndex = trackIndex % SLIDES.length;
    const activeSlide = SLIDES[logicalIndex];

    useEffect(() => {
        // Clone de boucle : logicalIndex = 0 mais déjà vu → ne pas re-tracker.
        if (trackIndex >= SLIDES.length) return;
        const slideId = SLIDES[logicalIndex]?.id;
        if (!slideId || seenSlidesRef.current.has(slideId)) return;
        seenSlidesRef.current.add(slideId);
        trackOnboardingStepViewed({
            step: analyticsStep,
            slide: slideId,
        });
    }, [analyticsStep, logicalIndex, trackIndex]);

    const resetLoop = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;

        loopResettingRef.current = true;
        programmaticScrollRef.current = true;

        el.style.scrollSnapType = "none";
        el.scrollLeft = 0;

        window.requestAnimationFrame(() => {
            setTrackIndex(0);
            window.requestAnimationFrame(() => {
                el.style.scrollSnapType = "";
                loopResettingRef.current = false;
                programmaticScrollRef.current = false;
            });
        });
    }, []);

    const goToNextSlide = useCallback(() => {
        setTrackIndex((current) => current + 1);
    }, []);

    useEffect(() => {
        if (trackIndex >= SLIDES.length) return;

        const holdMs = SLIDES[trackIndex].holdMs ?? SLIDE_HOLD_MS;
        const durationMs = reduceMotion
            ? REDUCED_MOTION_SLIDE_MS
            : SLIDES[trackIndex].durationMs + holdMs;
        const id = window.setTimeout(goToNextSlide, durationMs);
        return () => window.clearTimeout(id);
    }, [trackIndex, reduceMotion, goToNextSlide]);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el || loopResettingRef.current) return;

        programmaticScrollRef.current = true;

        el.scrollTo({
            left: trackIndex * el.clientWidth,
            behavior: reduceMotion ? "auto" : "smooth",
        });

        const releaseProgrammaticScroll = () => {
            if (loopResettingRef.current) return;
            programmaticScrollRef.current = false;
        };

        if (trackIndex === SLIDES.length) {
            if (reduceMotion) {
                resetLoop();
                return;
            }

            el.addEventListener("scrollend", resetLoop, { once: true });
            const fallbackId = window.setTimeout(resetLoop, 800);
            return () => {
                el.removeEventListener("scrollend", resetLoop);
                window.clearTimeout(fallbackId);
            };
        }

        el.addEventListener("scrollend", releaseProgrammaticScroll, { once: true });
        const fallbackId = window.setTimeout(releaseProgrammaticScroll, 700);

        return () => {
            el.removeEventListener("scrollend", releaseProgrammaticScroll);
            window.clearTimeout(fallbackId);
        };
    }, [trackIndex, reduceMotion, resetLoop]);

    const onScroll = () => {
        if (programmaticScrollRef.current || loopResettingRef.current) return;

        const el = scrollerRef.current;
        if (!el || el.clientWidth === 0) return;

        const next = Math.round(el.scrollLeft / el.clientWidth);
        if (next !== trackIndex && next >= 0 && next < LOOP_SLIDES.length) {
            setTrackIndex(next);
        }
    };

    return (
        <div
            className="flex min-h-0 flex-col"
            role="region"
            aria-roledescription="carousel"
            aria-label={UI.onboardingIntroCarouselA11y}
        >
            <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="flex min-h-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {LOOP_SLIDES.map((slide, slideIndex) => {
                    // La slide clone (fin de piste) ne doit pas lancer l'anim :
                    // elle sert uniquement au scroll, puis resetLoop revient à 0
                    // qui rejoue proprement depuis la pose de début.
                    const active =
                        slideIndex === trackIndex && trackIndex < SLIDES.length;
                    return (
                        <div
                            key={`${slide.id}-${slideIndex}`}
                            className="flex w-full shrink-0 snap-center flex-col justify-center px-1"
                            aria-hidden={!active}
                        >
                            <div
                                className="pointer-events-none h-60 w-full"
                                aria-hidden
                            >
                                <div
                                    key={active ? "play" : "idle"}
                                    className="h-full min-h-0"
                                >
                                    {slide.scene({
                                        active,
                                        reduceMotion,
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 space-y-2 text-center">
                <h2 className="font-one-more text-2xl font-semibold uppercase italic tracking-tight sm:text-3xl">
                    {activeSlide.title}
                </h2>
                <p className="text-sm text-muted-foreground">{activeSlide.body}</p>
            </div>

            <div
                className="mt-4 flex items-center justify-center gap-2"
                role="tablist"
                aria-label={UI.onboardingIntroCarouselA11y}
            >
                {SLIDES.map((slide, slideIndex) => {
                    const selected = slideIndex === logicalIndex;
                    return (
                        <button
                            key={slide.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-label={slide.title}
                            className={cn(
                                "size-2 rounded-full transition-colors",
                                selected ? "bg-foreground" : "bg-muted-foreground/40",
                            )}
                            onClick={() => setTrackIndex(slideIndex)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
