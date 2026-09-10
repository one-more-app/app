import logoBlack from '@/assets/logo-black.png'
import { Trackable } from '@/components/analytics/Trackable'
import {
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
import { useEffect, useRef, useState } from 'react'

const ONBOARDING_NOTIFICATIONS_AMBRE_SRC =
    '/images/onboarding-amber-squat.jpg'
const ONBOARDING_NOTIFICATIONS_TONY_SRC =
    '/images/onboarding-tony-hammer-curl.jpg'

type OnboardingNotificationsStepProps = {
    onContinue: () => void
    onSkip: () => void
}

function NotificationMockWithImage({
    title,
    body,
    time,
    imageSrc,
    imageObjectPosition,
    delayMs,
}: {
    title: string
    body: string
    time: string
    imageSrc: string
    imageObjectPosition?: string
    delayMs: number
}) {
    return (
        <OnboardingReveal delayMs={delayMs}>
            <div className="overflow-hidden rounded-3xl bg-card shadow-md ring-1 ring-border/50">
                <div className="px-3 py-2.5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                            <img
                                src={logoBlack}
                                alt=""
                                className="size-5 select-none object-contain"
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
                <div className="relative">
                    <img
                        src={imageSrc}
                        alt=""
                        className="h-40 w-full select-none object-cover sm:h-44"
                        style={
                            imageObjectPosition
                                ? { objectPosition: imageObjectPosition }
                                : undefined
                        }
                        draggable={false}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background/60 to-transparent"
                    />
                </div>
            </div>
        </OnboardingReveal>
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

    useEffect(() => {
        continuingRef.current = false
        void (async () => {
            const granted = await isPushPermissionGranted()
            if (!granted || continuingRef.current) return
            await registerPushIfPermitted()
        })()
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
                    <OnboardingReveal delayMs={80}>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {UI.onboardingNotificationsBody}
                        </p>
                    </OnboardingReveal>

                    <div className="relative mx-auto w-full max-w-sm space-y-3">
                        <NotificationMockWithImage
                            title={UI.onboardingNotificationsMockSessionTitle}
                            body={UI.onboardingNotificationsMockSessionBody}
                            time={UI.onboardingNotificationsMockSessionTime}
                            imageSrc={ONBOARDING_NOTIFICATIONS_AMBRE_SRC}
                            imageObjectPosition="50% 15%"
                            delayMs={120}
                        />
                        <NotificationMockWithImage
                            title={UI.onboardingNotificationsMockRecordTitle}
                            body={UI.onboardingNotificationsMockRecordBody}
                            time={UI.onboardingNotificationsMockRecordTime}
                            imageSrc={ONBOARDING_NOTIFICATIONS_TONY_SRC}
                            imageObjectPosition="50% 5%"
                            delayMs={200}
                        />
                    </div>

                    <div className="mt-auto space-y-2 pt-2">
                        <OnboardingReveal delayMs={300}>
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
