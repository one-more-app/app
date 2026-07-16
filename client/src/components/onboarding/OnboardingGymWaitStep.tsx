import {
    OnboardingReveal,
    onboardingStepCardClassName,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { subscribeAppStateChange } from '@/lib/app-state-listener'
import {
    getGymGeofencePermissions,
    registerGymGeofenceIfPermitted,
} from '@/lib/gym-geofence'
import { resolveGymWaitMonitoringBody } from '@/lib/gym-onboarding-wait-copy'
import { fetchUserGym } from '@/lib/gyms-api'
import { isGymPermissionsNativeContext } from '@/lib/onboarding-gym-dev'
import {
    isPushPermissionGranted,
    registerPushIfPermitted,
} from '@/lib/push-notifications'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { Check } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type OnboardingGymWaitStepProps = {
    initialGymName: string
    initialGymAddress?: string | null
    onUnlock: () => void
    onChangeGym: () => void
    unlocking?: boolean
}

function GymWaitMonitoringCard({
    gymName,
    isNative,
    showLocationRow,
}: {
    gymName: string
    isNative: boolean
    showLocationRow: boolean
}) {
    const monitoringBody = resolveGymWaitMonitoringBody({ gymName, isNative })

    return (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-start gap-3">
                <div className="relative mt-0.5 flex size-3 shrink-0 items-center justify-center">
                    <span
                        className="absolute inline-flex size-full animate-ping rounded-full bg-accent/40"
                        aria-hidden
                    />
                    <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-one-more text-xs font-semibold uppercase italic leading-tight">{UI.gymOnboardingWaitMonitoringTitle}</p>
                    <p className="text-sm text-muted-foreground">{monitoringBody}</p>
                </div>
            </div>
            <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-accent" aria-hidden />
                    <span>{UI.gymOnboardingWaitMonitoringNotifications}</span>
                </li>
                {showLocationRow ? (
                    <li className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-accent" aria-hidden />
                        <span>{UI.gymOnboardingWaitMonitoringLocation}</span>
                    </li>
                ) : null}
            </ul>
        </div>
    )
}

function GymWaitChoiceBlock() {
    return (
        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-4">
            <p className="text-sm font-medium">{UI.gymOnboardingWaitChoiceIntro}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                    <span className="shrink-0 text-foreground" aria-hidden>
                        1.
                    </span>
                    <span>{UI.gymOnboardingWaitChoiceWait}</span>
                </li>
                <li className="flex gap-2">
                    <span className="shrink-0 text-foreground" aria-hidden>
                        2.
                    </span>
                    <span>{UI.gymOnboardingWaitChoiceNow}</span>
                </li>
            </ul>
        </div>
    )
}

export function OnboardingGymWaitStep({
    initialGymName,
    initialGymAddress = null,
    onUnlock,
    onChangeGym,
    unlocking = false,
}: OnboardingGymWaitStepProps) {
    const isNative = Capacitor.isNativePlatform()
    const showLocationRow = isGymPermissionsNativeContext('gym-wait')

    const [gymName, setGymName] = useState(initialGymName)
    const [gymAddress, setGymAddress] = useState(initialGymAddress)
    const wasBackgroundedRef = useRef(false)

    const hasGym = gymName.trim().length > 0

    const registerGeofenceFromApi = useCallback(async () => {
        const gym = await fetchUserGym()
        if (!gym?.geofenceEnabled) return
        await registerGymGeofenceIfPermitted({
            lat: gym.lat,
            lng: gym.lng,
            radiusM: gym.radiusM,
            gymName: gym.name,
            onboardingGymPending: gym.onboardingGymPending,
        })
    }, [])

    const refreshPermissionState = useCallback(async () => {
        const pushGranted = await isPushPermissionGranted()
        if (pushGranted) {
            await registerPushIfPermitted()
        }

        if (!isNative) return

        const locationStatus = await getGymGeofencePermissions()
        if (locationStatus.ready) {
            await registerGeofenceFromApi()
        }
    }, [isNative, registerGeofenceFromApi])

    const loadGymFromApi = useCallback(async () => {
        try {
            const gym = await fetchUserGym()
            if (!gym?.name) return
            setGymName(gym.name)
            setGymAddress(gym.address)
        } catch {
            /* API indisponible. */
        }
    }, [])

    useEffect(() => {
        void loadGymFromApi()
        void refreshPermissionState()
    }, [loadGymFromApi, refreshPermissionState])

    useEffect(() => {
        if (!isNative) return

        return subscribeAppStateChange((isActive) => {
            if (!isActive) {
                wasBackgroundedRef.current = true
                return
            }
            if (!wasBackgroundedRef.current) return
            void refreshPermissionState()
        })
    }, [isNative, refreshPermissionState])

    return (
        <OnboardingStepLayout>
            <StepCard
                className={onboardingStepCardClassName}
                title={UI.gymOnboardingWaitTitle}
                headerClassName="space-y-3"
                contentClassName="space-y-5"
            >
                <OnboardingReveal delayMs={120}>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {UI.gymOnboardingWaitValueProp}
                    </p>
                </OnboardingReveal>

                <OnboardingReveal delayMs={180}>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">{UI.gymOnboardingWaitGymSection}</p>
                        {hasGym ? (
                            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                                <p className="font-semibold">{gymName}</p>
                                {gymAddress ? (
                                    <p className="mt-1 text-sm text-muted-foreground">{gymAddress}</p>
                                ) : null}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={onChangeGym}
                                >
                                    {UI.gymOnboardingWaitGymChange}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                                <p className="text-sm text-muted-foreground">
                                    {UI.gymOnboardingWaitGymEmpty}
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={onChangeGym}
                                >
                                    {UI.gymSettingsAdd}
                                </Button>
                            </div>
                        )}
                    </div>
                </OnboardingReveal>

                <OnboardingReveal delayMs={240}>
                    <GymWaitMonitoringCard
                        gymName={gymName}
                        isNative={isNative}
                        showLocationRow={showLocationRow}
                    />
                </OnboardingReveal>

                <OnboardingReveal delayMs={360}>
                    <GymWaitChoiceBlock />
                </OnboardingReveal>

                <OnboardingReveal delayMs={420}>
                    <Button
                        variant="accent"
                        className="mt-1 w-full"
                        disabled={unlocking}
                        onClick={onUnlock}
                    >
                        {UI.gymOnboardingWaitCta}
                    </Button>
                </OnboardingReveal>
            </StepCard>
        </OnboardingStepLayout>
    )
}
