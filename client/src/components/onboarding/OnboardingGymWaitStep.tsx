import { GymOnboardingPermissionRow } from '@/components/onboarding/GymOnboardingPermissionRow'
import {
    onboardingStepCardClassName,
    OnboardingReveal,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { subscribeAppStateChange } from '@/lib/app-state-listener'
import {
    resolveGymWaitBodyCopy,
    resolveGymWaitRemindersHint,
} from '@/lib/gym-onboarding-wait-copy'
import {
    getGymGeofencePermissions,
    openGymGeofenceSettings,
    registerGymGeofenceIfPermitted,
    requestGymGeofencePermissions,
} from '@/lib/gym-geofence'
import { fetchUserGym } from '@/lib/gyms-api'
import {
    isGymPermissionsDevWebPreview,
    isGymPermissionsNativeContext,
} from '@/lib/onboarding-gym-dev'
import {
    isPushPermissionGranted,
    registerPushIfPermitted,
    requestPushPermission,
} from '@/lib/push-notifications'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { Bell, Dumbbell, MapPin } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type OnboardingGymWaitStepProps = {
    initialGymName: string
    onUnlock: () => void
    onChangeGym: () => void
    unlocking?: boolean
}

export function OnboardingGymWaitStep({
    initialGymName,
    onUnlock,
    onChangeGym,
    unlocking = false,
}: OnboardingGymWaitStepProps) {
    const isNative = Capacitor.isNativePlatform()
    const isDevWebPreview = isGymPermissionsDevWebPreview()
    const showLocationRow = isGymPermissionsNativeContext('gym-wait')

    const [gymName, setGymName] = useState(initialGymName)

    const [notificationsOn, setNotificationsOn] = useState(false)
    const [locationOn, setLocationOn] = useState(false)
    const [busyNotifications, setBusyNotifications] = useState(false)
    const [busyLocation, setBusyLocation] = useState(false)
    const [showLocationSettings, setShowLocationSettings] = useState(false)
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
        setNotificationsOn(pushGranted)

        if (!isNative) return

        const locationStatus = await getGymGeofencePermissions()
        if (locationStatus.ready) {
            await registerGeofenceFromApi()
            setLocationOn(true)
            setShowLocationSettings(false)
        } else {
            setLocationOn(false)
        }
    }, [isNative, registerGeofenceFromApi])

    const loadGymFromApi = useCallback(async () => {
        try {
            const gym = await fetchUserGym()
            if (!gym?.name) return
            setGymName(gym.name)
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

    const handleNotificationsToggle = async (checked: boolean) => {
        if (!checked || busyNotifications) {
            setNotificationsOn(false)
            return
        }
        if (isDevWebPreview) {
            setNotificationsOn(true)
            return
        }
        setBusyNotifications(true)
        try {
            const granted = await requestPushPermission()
            if (granted) {
                await registerPushIfPermitted()
            }
            setNotificationsOn(granted)
        } finally {
            setBusyNotifications(false)
        }
    }

    const handleLocationToggle = async (checked: boolean) => {
        if (!checked || busyLocation) {
            setLocationOn(false)
            return
        }
        if (isDevWebPreview) {
            setLocationOn(true)
            return
        }
        if (!isNative) {
            setLocationOn(false)
            return
        }
        setBusyLocation(true)
        setShowLocationSettings(false)
        try {
            const status = await requestGymGeofencePermissions()
            if (status.ready) {
                await registerGeofenceFromApi()
                setLocationOn(true)
                return
            }
            setLocationOn(false)
            setShowLocationSettings(status.needsSettings)
        } finally {
            setBusyLocation(false)
        }
    }

    const bodyCopy = resolveGymWaitBodyCopy({
        hasGym,
        gymName,
        notificationsOn,
        locationOn,
        isNative,
    })

    const remindersHint = resolveGymWaitRemindersHint({
        notificationsOn,
        locationOn,
        isNative,
    })

    return (
        <OnboardingStepLayout>
            <StepCard
                className={onboardingStepCardClassName}
                title={UI.gymOnboardingWaitTitle}
            >
                <OnboardingReveal delayMs={80}>
                    <div className="flex justify-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
                            <Dumbbell className="size-8" aria-hidden />
                        </div>
                    </div>
                </OnboardingReveal>

                <OnboardingReveal delayMs={140}>
                    <p className="text-sm text-muted-foreground">{bodyCopy}</p>
                </OnboardingReveal>

                <OnboardingReveal delayMs={200}>
                    <div className="space-y-2">
                        <p className="font-one-more text-xs font-semibold uppercase italic tracking-wide text-muted-foreground">
                            {UI.gymOnboardingWaitGymSection}
                        </p>
                        {hasGym ? (
                            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                                <p className="font-semibold">{gymName}</p>
                                <Button
                                    type="button"
                                    variant="outline"
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
                                    variant="outline"
                                    className="w-full"
                                    onClick={onChangeGym}
                                >
                                    {UI.gymSettingsAdd}
                                </Button>
                            </div>
                        )}
                    </div>
                </OnboardingReveal>

                <OnboardingReveal delayMs={280}>
                    <div className="space-y-2">
                        <div>
                            <p className="font-one-more text-xs font-semibold uppercase italic tracking-wide text-muted-foreground">
                                {UI.gymOnboardingWaitRemindersSection}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{remindersHint}</p>
                        </div>
                        <div className="space-y-2">
                            <GymOnboardingPermissionRow
                                icon={Bell}
                                label={UI.gymOnboardingPermissionsNotificationsLabel}
                                hint={UI.gymOnboardingPermissionsNotificationsHint}
                                checked={notificationsOn}
                                busy={busyNotifications}
                                onCheckedChange={(checked) =>
                                    void handleNotificationsToggle(checked)
                                }
                            />
                            {showLocationRow ? (
                                <GymOnboardingPermissionRow
                                    icon={MapPin}
                                    label={UI.gymOnboardingPermissionsLocationLabel}
                                    hint={UI.gymOnboardingPermissionsLocationHint}
                                    checked={locationOn}
                                    busy={busyLocation}
                                    onCheckedChange={(checked) =>
                                        void handleLocationToggle(checked)
                                    }
                                />
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    {UI.gymOnboardingWebOnly}
                                </p>
                            )}
                        </div>
                    </div>
                </OnboardingReveal>

                {showLocationSettings ? (
                    <OnboardingReveal delayMs={340}>
                        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                {UI.gymOnboardingLocationDenied}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {UI.gymOnboardingLocationSettingsHint}
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => void openGymGeofenceSettings()}
                            >
                                {UI.gymOnboardingLocationSettingsCta}
                            </Button>
                        </div>
                    </OnboardingReveal>
                ) : null}

                <OnboardingReveal delayMs={400}>
                    <Button
                        variant="accent"
                        className="w-full"
                        disabled={unlocking || busyNotifications || busyLocation}
                        onClick={onUnlock}
                    >
                        {UI.gymOnboardingWaitCta}
                    </Button>
                </OnboardingReveal>
            </StepCard>
        </OnboardingStepLayout>
    )
}
