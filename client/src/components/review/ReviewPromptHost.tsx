import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/use-auth";
import { useCelebrationQueueSnapshot } from "@/hooks/use-celebration-queue-active";
import { useLatestGlobalPerf } from "@/hooks/use-latest-global-perf";
import { useRestSinceLastSet } from "@/hooks/use-rest-since-last-set";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import { useRestTimerEnabled } from "@/hooks/use-rest-timer-enabled";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
    markReviewPulseAnswer,
    markReviewPulseShown,
    markReviewStoreOpened,
    openStoreReviewListing,
    setReviewSessionCardPending,
} from "@/lib/app-review";
import { hapticImpact } from "@/lib/haptics";
import { getLocalDateKey } from "@/lib/local-date";
import {
    buildReviewPulseEligibilityInput,
    isReviewPulseEligibleNow,
    loadReviewAppVersion,
    loadReviewDeviceInfo,
} from "@/lib/review-build-context";
import {
    getReviewPulseIneligibilityReasons,
    isTransientReviewPulseBlocker,
} from "@/lib/review-eligibility";
import { submitReviewFeedback } from "@/lib/review-feedback-api";
import {
    enqueueReviewFeedback,
    flushReviewFeedbackQueue,
    installReviewFeedbackQueueFlush,
} from "@/lib/review-feedback-queue";
import { subscribeReviewPerfDrawerOpen } from "@/lib/review-perf-drawer-open";
import { isReviewPulsePlatformAllowed } from "@/lib/review-platform";
import {
    REVIEW_PULSE_FORCE_OPEN_EVENT,
} from "@/lib/review-pulse-debug";
import { getDistinctSessionDateKeys } from "@/lib/review-session-dates";
import { listenReviewSessionSyncErrors } from "@/lib/review-session-sync-error";
import {
    getReviewCopy,
    getReviewLocale,
    REVIEW_COPY,
    type ReviewChipKey,
} from "@/lib/translations";
import { cn } from "@/lib/utils";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

type Step = "pulse" | "positive" | "negative";

const CHIP_KEYS = Object.keys(
    REVIEW_COPY.fr.negative.chips,
) as ReviewChipKey[];

const PULSE_DELAY_MS = 1500;

export function ReviewPromptHost() {
    const auth = useAuth();
    const location = useLocation();
    const { current, isActive: celebrationQueueActive } =
        useCelebrationQueueSnapshot();
    const latestGlobal = useLatestGlobalPerf();
    const targetMs = useRestTargetMs();
    const restEnabled = useRestTimerEnabled();
    const rest = useRestSinceLastSet(latestGlobal?.entry.createdAt ?? null);

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("pulse");
    const [selectedChips, setSelectedChips] = useState<ReviewChipKey[]>([]);
    const [message, setMessage] = useState("");
    const [prExercise, setPrExercise] = useState<string | undefined>();

    const prevKindRef = useRef(current?.kind ?? null);
    const lastRecordExerciseRef = useRef<string | undefined>();
    const recordClosedAtRef = useRef<number | null>(null);
    const pendingAfterRecordRef = useRef(false);
    const intentionalCloseRef = useRef(false);
    const shownThisOpenRef = useRef(false);

    const onSessionRecapRoute = location.pathname.startsWith("/session/");

    const restContext = useCallback(
        () => ({
            restTimerEnabled: restEnabled,
            restBarVisible: rest.visible,
            elapsedMs: rest.elapsedMs,
            targetMs,
            celebrationQueueActive,
            onSessionRecapRoute,
        }),
        [
            restEnabled,
            rest.visible,
            rest.elapsedMs,
            targetMs,
            celebrationQueueActive,
            onSessionRecapRoute,
        ],
    );

    const forceOpenPulse = useCallback((stepOverride: Step = "pulse") => {
        if (open) return;
        setStep(stepOverride);
        setSelectedChips([]);
        setMessage("");
        shownThisOpenRef.current = true;
        void hapticImpact();
        setOpen(true);
    }, [open]);

    const tryOpenPulse = useCallback(() => {
        if (!isReviewPulsePlatformAllowed()) return;
        if (open) return;
        const ctx = restContext();
        const input = buildReviewPulseEligibilityInput(ctx);
        if (!isReviewPulseEligibleNow(ctx)) {
            const reasons = getReviewPulseIneligibilityReasons(input);
            const onlyTransient =
                reasons.length > 0 &&
                reasons.every((r) => isTransientReviewPulseBlocker(r));
            if (!onlyTransient) {
                pendingAfterRecordRef.current = false;
            }
            if (import.meta.env.DEV && reasons.length > 0) {
                console.info("[review-pulse] blocked", reasons, input);
            }
            return;
        }

        pendingAfterRecordRef.current = false;
        setStep("pulse");
        setSelectedChips([]);
        setMessage("");
        shownThisOpenRef.current = true;

        const today = getLocalDateKey();
        markReviewPulseShown(today);

        const sessionsCount = input.distinctSessionDateKeys.length;
        const restRemainingS = Math.floor(input.restRemainingMs / 1000);

        track(AnalyticsEvents.REVIEW_PULSE_ELIGIBLE, {
            variant: "simple",
            rest_remaining_s: restRemainingS,
            pr_exercise: prExercise,
            sessions_count: sessionsCount,
        });

        void hapticImpact();
        setOpen(true);

        track(AnalyticsEvents.REVIEW_PULSE_SHOWN, {
            variant: "simple",
            rest_remaining_s: restRemainingS,
            pr_exercise: prExercise,
            sessions_count: sessionsCount,
        });
    }, [open, prExercise, restContext]);

    useEffect(() => {
        if (current?.kind === "record") {
            lastRecordExerciseRef.current = current.payload.exerciseName;
        }
        const prev = prevKindRef.current;
        const next = current?.kind ?? null;
        if (prev === "record" && next !== "record") {
            recordClosedAtRef.current = Date.now();
            pendingAfterRecordRef.current = true;
            setPrExercise(lastRecordExerciseRef.current);
        }
        prevKindRef.current = next;
    }, [current]);

    useEffect(() => {
        if (!pendingAfterRecordRef.current) return;
        if (celebrationQueueActive) return;
        const closedAt = recordClosedAtRef.current;
        if (closedAt == null) return;

        const tick = () => {
            if (!pendingAfterRecordRef.current) return;
            if (celebrationQueueActive) return;
            if (Date.now() - closedAt < PULSE_DELAY_MS) return;
            tryOpenPulse();
        };

        const id = window.setInterval(tick, 200);
        tick();
        return () => window.clearInterval(id);
    }, [celebrationQueueActive, tryOpenPulse, current]);

    useEffect(() => {
        if (!open) return;
        if (!rest.targetComplete) return;
        intentionalCloseRef.current = true;
        markReviewPulseAnswer("rest_over");
        track(AnalyticsEvents.REVIEW_PULSE_DISMISSED, { reason: "rest_over" });
        toast(getReviewCopy().toast.restOver);
        setOpen(false);
    }, [open, rest.targetComplete]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const remove = App.addListener("appStateChange", ({ isActive }) => {
            if (isActive && step === "positive") {
                toast(getReviewCopy().toast.thanksStore);
            }
        });
        return () => {
            void remove.then((h) => h.remove());
        };
    }, [step]);

    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const onForce = (event: Event) => {
            const detail = (event as CustomEvent<{ step?: Step }>).detail;
            const nextStep =
                detail?.step === "positive" || detail?.step === "negative"
                    ? detail.step
                    : "pulse";
            forceOpenPulse(nextStep);
        };
        window.addEventListener(REVIEW_PULSE_FORCE_OPEN_EVENT, onForce);
        return () => window.removeEventListener(REVIEW_PULSE_FORCE_OPEN_EVENT, onForce);
    }, [forceOpenPulse]);

    useEffect(() => subscribeReviewPerfDrawerOpen(() => { }), []);

    useEffect(() => {
        const stopSync = listenReviewSessionSyncErrors();
        const stopFlush = installReviewFeedbackQueueFlush();
        return () => {
            stopSync();
            stopFlush();
        };
    }, []);

    const closeDrawer = () => {
        intentionalCloseRef.current = true;
        setOpen(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setOpen(true);
            return;
        }
        if (intentionalCloseRef.current) {
            intentionalCloseRef.current = false;
            setOpen(false);
            setStep("pulse");
            return;
        }
        if (step === "pulse" && shownThisOpenRef.current) {
            markReviewPulseAnswer("dismissed");
            track(AnalyticsEvents.REVIEW_PULSE_DISMISSED, { reason: "swipe" });
        }
        setOpen(false);
        setStep("pulse");
        shownThisOpenRef.current = false;
    };

    const copy = getReviewCopy();
    const platform = Capacitor.getPlatform();
    const positiveText =
        platform === "android" ? copy.positive.textAndroid : copy.positive.textIos;

    const canSendFeedback =
        selectedChips.length > 0 || message.trim().length >= 3;

    const handleYes = () => {
        markReviewPulseAnswer("yes");
        track(AnalyticsEvents.REVIEW_PULSE_ANSWERED, { answer: "yes" });
        setStep("positive");
    };

    const handleNo = () => {
        markReviewPulseAnswer("no");
        track(AnalyticsEvents.REVIEW_PULSE_ANSWERED, { answer: "no" });
        setStep("negative");
    };

    const handleStore = async (source: "pulse" | "session_card") => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            toast(copy.toast.storeOffline);
            setReviewSessionCardPending(true);
            closeDrawer();
            return;
        }
        track(AnalyticsEvents.REVIEW_STORE_OPENED, { source });
        await openStoreReviewListing();
        markReviewStoreOpened();
        closeDrawer();
    };

    const handleLater = () => {
        setReviewSessionCardPending(true);
        track(AnalyticsEvents.REVIEW_LATER_SELECTED, {});
        closeDrawer();
    };

    const toggleChip = (key: ReviewChipKey) => {
        setSelectedChips((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    const sendFeedback = async () => {
        if (!canSendFeedback) return;
        const locale = getReviewLocale();
        const appVersion = await loadReviewAppVersion();
        const device = selectedChips.includes("bug")
            ? await loadReviewDeviceInfo()
            : {};
        const payload = {
            chips: selectedChips,
            message: message.trim() || undefined,
            appVersion,
            platform: Capacitor.getPlatform() as "ios" | "android" | "web",
            locale,
            sessionsCount: getDistinctSessionDateKeys().length,
            createdAt: new Date().toISOString(),
            sessionId: getLocalDateKey(),
            ...device,
        };

        const queued = typeof navigator !== "undefined" && !navigator.onLine;
        if (queued) {
            enqueueReviewFeedback(payload);
            toast(copy.toast.feedbackQueued);
            track(AnalyticsEvents.REVIEW_FEEDBACK_SENT, {
                chips: selectedChips.join(","),
                has_message: message.trim().length > 0,
                queued: true,
            });
            closeDrawer();
            return;
        }

        try {
            await submitReviewFeedback(payload);
            toast(copy.toast.feedbackSent);
            track(AnalyticsEvents.REVIEW_FEEDBACK_SENT, {
                chips: selectedChips.join(","),
                has_message: message.trim().length > 0,
                queued: false,
            });
        } catch {
            enqueueReviewFeedback(payload);
            toast(copy.toast.feedbackQueued);
            track(AnalyticsEvents.REVIEW_FEEDBACK_SENT, {
                chips: selectedChips.join(","),
                has_message: message.trim().length > 0,
                queued: true,
            });
        }
        void flushReviewFeedbackQueue();
        closeDrawer();
    };

    const skipFeedback = () => {
        track(AnalyticsEvents.REVIEW_FEEDBACK_SKIPPED, {});
        closeDrawer();
    };

    if (!isReviewPulsePlatformAllowed()) return null;
    if (auth.status !== "authenticated") return null;

    return (
        <Drawer
            open={open}
            onOpenChange={handleOpenChange}
            data-analytics-label="review_pulse"
        >
            <DrawerContent className="max-h-[min(85vh,calc(100vh-var(--safe-top)-6rem))]">
                <div className="mx-auto w-full max-w-lg overflow-y-auto p-4 pb-6">
                    {step === "pulse" ? (
                        <>
                            <DrawerHeader className="text-left">
                                <DrawerTitle>{copy.pulse.title}</DrawerTitle>
                            </DrawerHeader>
                            <div className="mt-4 flex flex-col gap-2">
                                <Button variant="accent" className="w-full" onClick={handleYes}>
                                    {copy.pulse.yes}
                                </Button>
                                <Button variant="secondary" className="w-full bg-card" onClick={handleNo}>
                                    {copy.pulse.no}
                                </Button>
                            </div>
                        </>
                    ) : null}

                    {step === "positive" ? (
                        <>
                            <DrawerHeader className="text-left">
                                <DrawerTitle className="text-lg">
                                    {copy.positive.title}
                                </DrawerTitle>
                                <DrawerDescription className="text-sm text-muted-foreground">
                                    {positiveText}
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="mt-4 flex flex-col gap-2">
                                <Button
                                    variant="accent"
                                    className="w-full"
                                    onClick={() => void handleStore("pulse")}
                                >
                                    {copy.positive.cta}
                                </Button>
                                <Button variant="secondary" className="w-full bg-card" onClick={handleLater}>
                                    {copy.positive.later}
                                </Button>
                            </div>
                        </>
                    ) : null}

                    {step === "negative" ? (
                        <>
                            <DrawerHeader className="text-left">
                                <DrawerTitle className="text-lg">
                                    {copy.negative.title}
                                </DrawerTitle>
                                <DrawerDescription>{copy.negative.subtitle}</DrawerDescription>
                            </DrawerHeader>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {CHIP_KEYS.map((key) => {
                                    const active = selectedChips.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            className={cn(
                                                "rounded-full  px-3 py-2 text-sm transition-colors",
                                                active
                                                    ? "bg-card text-foreground"
                                                    : "bg-card/50 text-muted-foreground",
                                            )}
                                            onClick={() => toggleChip(key)}
                                        >
                                            {copy.negative.chips[key]}
                                        </button>
                                    );
                                })}
                            </div>
                            <textarea
                                className="mt-3 min-h-[88px] w-full rounded-xl bg-card px-3 py-2 text-base text-foreground"
                                placeholder={copy.negative.placeholder}
                                maxLength={280}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {copy.negative.counter}
                            </p>
                            <div className="mt-4 flex flex-col gap-2">
                                <Button
                                    variant="accent"
                                    className="w-full"
                                    disabled={!canSendFeedback}
                                    onClick={() => void sendFeedback()}
                                >
                                    {copy.negative.send}
                                </Button>
                                <Button variant="secondary" className="w-full bg-card" onClick={skipFeedback}>
                                    {copy.negative.skip}
                                </Button>
                            </div>
                        </>
                    ) : null}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
