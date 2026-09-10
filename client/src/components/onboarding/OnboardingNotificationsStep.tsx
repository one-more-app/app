import logoBlack from '@/assets/logo-black.png'
import { Trackable } from '@/components/analytics/Trackable'
import {
    onboardingEntrance,
    OnboardingReveal,
    onboardingStepCardClassName,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import {
    AnalyticsEvents,
    OnboardingSteps,
    track,
    useOnboardingStepViewed,
} from '@/lib/analytics'
import { hapticImpact } from '@/lib/haptics'
import {
    isPushPermissionGranted,
    registerPushIfPermitted,
    requestPushPermission,
} from '@/lib/push-notifications'
import { setNotificationsEduDone } from '@/lib/storage'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState, type ReactNode } from 'react'

const ONBOARDING_NOTIFICATIONS_AMBRE_SRC =
    '/images/onboarding-amber-squat.jpg'

const CASCADE_START_MS = 220
const CASCADE_STAGGER_MS = 500
const CTA_AFTER_LAST_MS = 280

type MockNotification = {
    id: string
    title: string
    body: string
    time: string
    imageSrc?: string
    imageObjectPosition?: string
}

const MOCK_NOTIFICATIONS: MockNotification[] = [
    {
        id: 'session',
        title: UI.onboardingNotificationsMockSessionTitle,
        body: UI.onboardingNotificationsMockSessionBody,
        time: UI.onboardingNotificationsMockSessionTime,
        imageSrc: ONBOARDING_NOTIFICATIONS_AMBRE_SRC,
        imageObjectPosition: '50% 15%',
    },
    {
        id: 'record',
        title: UI.onboardingNotificationsMockRecordTitle,
        body: UI.onboardingNotificationsMockRecordBody,
        time: UI.onboardingNotificationsMockRecordTime,
    },
    {
        id: 'streak',
        title: UI.onboardingNotificationsMockStreakTitle,
        body: UI.onboardingNotificationsMockStreakBody,
        time: UI.onboardingNotificationsMockStreakTime,
    },
    {
        id: 'reaction',
        title: UI.onboardingNotificationsMockReactionTitle,
        body: UI.onboardingNotificationsMockReactionBody,
        time: UI.onboardingNotificationsMockReactionTime,
    },
]

type OnboardingNotificationsStepProps = {
    onContinue: () => void
    onSkip: () => void
}

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function NotificationMockCard({
    title,
    body,
    time,
    imageSrc,
    imageObjectPosition,
}: Omit<MockNotification, 'id'>) {
    return (
        <div className="overflow-hidden rounded-3xl bg-card">
            <div className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                        <img
                            src={logoBlack}
                            alt=""
                            className="size-5 select-none object-contain -mr-0.5"
                            draggable={false}
                            aria-hidden
                        />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {title}
                            </p>
                            <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                {time}
                            </p>
                        </div>
                        <p className="text-sm leading-snug text-muted-foreground">
                            {body}
                        </p>
                    </div>
                </div>
            </div>
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt=""
                    className="h-36 w-full select-none object-cover sm:h-40"
                    style={
                        imageObjectPosition
                            ? { objectPosition: imageObjectPosition }
                            : undefined
                    }
                    draggable={false}
                />
            ) : null}
        </div>
    )
}

function NotificationArrival({
    children,
    animate,
}: {
    children: ReactNode
    animate: boolean
}) {
    return (
        <div
            className={
                animate
                    ? onboardingEntrance(
                        'animate-in fade-in-0 slide-in-from-top-4 duration-400',
                    )
                    : undefined
            }
        >
            {children}
        </div>
    )
}

export function OnboardingNotificationsStep({
    onContinue,
    onSkip,
}: OnboardingNotificationsStepProps) {
    useOnboardingStepViewed(OnboardingSteps.NOTIFICATIONS)
    const [busy, setBusy] = useState(false)
    const continuingRef = useRef(false)
    const isNative = Capacitor.isNativePlatform()

    const reducedMotion = prefersReducedMotion()
    const [visibleCount, setVisibleCount] = useState(() =>
        reducedMotion ? MOCK_NOTIFICATIONS.length : 0,
    )
    const [cascadeAnimate, setCascadeAnimate] = useState(!reducedMotion)

    useEffect(() => {
        continuingRef.current = false
        void (async () => {
            const granted = await isPushPermissionGranted()
            if (!granted || continuingRef.current) return
            await registerPushIfPermitted()
        })()
    }, [])

    useEffect(() => {
        if (prefersReducedMotion()) {
            setCascadeAnimate(false)
            setVisibleCount(MOCK_NOTIFICATIONS.length)
            return
        }

        setCascadeAnimate(true)
        setVisibleCount(0)
        const timers = MOCK_NOTIFICATIONS.map((_, index) =>
            window.setTimeout(() => {
                setVisibleCount(index + 1)
                void hapticImpact()
            }, CASCADE_START_MS + index * CASCADE_STAGGER_MS),
        )

        return () => {
            for (const timer of timers) window.clearTimeout(timer)
        }
    }, [])

    const leave = (next: () => void) => {
        if (continuingRef.current) return
        continuingRef.current = true
        if (!isNative) {
            setNotificationsEduDone(true)
        }
        next()
    }

    const handleEnable = async () => {
        if (busy || continuingRef.current || !isNative) return
        setBusy(true)
        try {
            const granted = await requestPushPermission()
            if (granted) {
                await registerPushIfPermitted()
                void hapticImpact()
            }
            track(
                granted
                    ? AnalyticsEvents.PUSH_NOTIFICATION_ENABLED
                    : AnalyticsEvents.PUSH_NOTIFICATION_DISABLED,
                { source: 'onboarding_notifications' },
            )
            leave(onContinue)
        } finally {
            setBusy(false)
        }
    }

    const handleSkip = () => {
        if (busy) return
        leave(onSkip)
    }

    const ctaDelayMs = cascadeAnimate
        ? CASCADE_START_MS +
        (MOCK_NOTIFICATIONS.length - 1) * CASCADE_STAGGER_MS +
        CTA_AFTER_LAST_MS
        : 80

    return (
        <Trackable section="onboarding" feature={OnboardingSteps.NOTIFICATIONS}>
            <OnboardingStepLayout>
                <StepCard
                    className={onboardingStepCardClassName}
                    title={UI.onboardingNotificationsTitle}
                    headerClassName="space-y-3"
                    contentClassName="space-y-4"
                    onSkip={handleSkip}
                    skipLabel={UI.onboardingSkip}
                    skipAnalyticsLabel="onboarding_notifications_skip"
                >
                    <div
                        className="relative flex w-full flex-col gap-2.5"
                        aria-live="polite"
                    >
                        {MOCK_NOTIFICATIONS.slice(0, visibleCount).map(
                            (mock) => (
                                <NotificationArrival
                                    key={mock.id}
                                    animate={cascadeAnimate}
                                >
                                    <NotificationMockCard
                                        title={mock.title}
                                        body={mock.body}
                                        time={mock.time}
                                        imageSrc={mock.imageSrc}
                                        imageObjectPosition={
                                            mock.imageObjectPosition
                                        }
                                    />
                                </NotificationArrival>
                            ),
                        )}
                    </div>

                    <div className="mt-auto space-y-2 pt-2">
                        <OnboardingReveal delayMs={ctaDelayMs}>
                            {isNative ? (
                                <Button
                                    variant="accent"
                                    className="w-full"
                                    data-analytics-label="onboarding_notifications_enable"
                                    disabled={busy}
                                    onClick={() => void handleEnable()}
                                >
                                    {UI.onboardingNotificationsCta}
                                </Button>
                            ) : (
                                <Button
                                    variant="accent"
                                    className="w-full"
                                    data-analytics-label="onboarding_notifications_web_cta"
                                    disabled
                                >
                                    {UI.onboardingNotificationsCtaWeb}
                                </Button>
                            )}
                        </OnboardingReveal>
                    </div>
                </StepCard>
            </OnboardingStepLayout>
        </Trackable>
    )
}
