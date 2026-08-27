import {
    OnboardingReveal,
    onboardingStepCardClassName,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import { ReminderScheduleFields } from '@/components/notifications/ReminderScheduleFields'
import { Trackable } from '@/components/analytics/Trackable'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { AnalyticsEvents, OnboardingSteps, track } from '@/lib/analytics'
import { hapticImpact } from '@/lib/haptics'
import { updateNotificationPreferences } from '@/lib/notifications-api'
import {
    isPushPermissionGranted,
    registerPushIfPermitted,
    requestPushPermission,
} from '@/lib/push-notifications'
import {
    DEFAULT_REMINDER_SLOTS,
    type ReminderSlot,
} from '@/lib/reminder-schedule'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'

type OnboardingNotificationsStepProps = {
    onContinue: () => void
    onSkip: () => void
}

export function OnboardingNotificationsStep({
    onContinue,
    onSkip,
}: OnboardingNotificationsStepProps) {
    const [busy, setBusy] = useState(false)
    const [slots, setSlots] = useState<ReminderSlot[]>(DEFAULT_REMINDER_SLOTS)
    const continuingRef = useRef(false)

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
        next()
    }

    const saveSchedule = async () => {
        if (slots.length === 0) return
        try {
            await updateNotificationPreferences({
                streakReminders: true,
                reminderSlots: slots,
            })
        } catch {
            /* Le CTA push reste prioritaire. */
        }
    }

    const handleEnable = async () => {
        if (busy || continuingRef.current || slots.length === 0) return
        setBusy(true)
        try {
            await saveSchedule()
            const granted = await requestPushPermission()
            if (granted) {
                await registerPushIfPermitted()
                void hapticImpact()
            }
            if (Capacitor.isNativePlatform()) {
                track(
                    granted
                        ? AnalyticsEvents.PUSH_NOTIFICATION_ENABLED
                        : AnalyticsEvents.PUSH_NOTIFICATION_DISABLED,
                    { source: 'onboarding_notifications' },
                )
            }
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
                    contentClassName="space-y-5"
                >
                    <OnboardingReveal delayMs={80}>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {UI.onboardingNotificationsBody}
                        </p>
                    </OnboardingReveal>
                    <OnboardingReveal delayMs={160}>
                        <ReminderScheduleFields
                            slots={slots}
                            onChange={setSlots}
                            disabled={busy}
                        />
                    </OnboardingReveal>
                    <div className="mt-auto space-y-2">
                        <OnboardingReveal delayMs={280}>
                            <Button
                                variant="accent"
                                className="w-full"
                                data-analytics-label="onboarding_notifications_enable"
                                disabled={busy || slots.length === 0}
                                onClick={() => void handleEnable()}
                            >
                                {UI.onboardingNotificationsCta}
                            </Button>
                        </OnboardingReveal>
                        <OnboardingReveal delayMs={360}>
                            <Button
                                variant="secondary"
                                className="w-full"
                                data-analytics-label="onboarding_notifications_skip"
                                disabled={busy}
                                onClick={handleSkip}
                            >
                                {UI.later}
                            </Button>
                        </OnboardingReveal>
                    </div>
                </StepCard>
            </OnboardingStepLayout>
        </Trackable>
    )
}
