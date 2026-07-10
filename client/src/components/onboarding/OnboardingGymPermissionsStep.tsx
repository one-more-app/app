import { GymOnboardingPermissionRow } from '@/components/onboarding/GymOnboardingPermissionRow'
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
    openGymGeofenceSettings,
    promptGymGeofenceLocationAccess,
    registerGymGeofenceIfPermitted,
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
import { Bell, MapPin } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type OnboardingGymPermissionsStepProps = {
    gymName: string
    gymAddress: string | null
    onContinue: () => void
    onChangeGym: () => void
}

export function OnboardingGymPermissionsStep({
    gymName,
    gymAddress,
    onContinue,
    onChangeGym,
}: OnboardingGymPermissionsStepProps) {
    const isNative = Capacitor.isNativePlatform()
    const isDevWebPreview = isGymPermissionsDevWebPreview()
    const showLocationRow = isGymPermissionsNativeContext('gym-permissions')
    const [notificationsOn, setNotificationsOn] = useState(false)
    const [locationOn, setLocationOn] = useState(false)
    const [busyNotifications, setBusyNotifications] = useState(false)
    const [busyLocation, setBusyLocation] = useState(false)
    const [showLocationSettings, setShowLocationSettings] = useState(false)
    const [displayName, setDisplayName] = useState(gymName)
    const [displayAddress, setDisplayAddress] = useState(gymAddress)
    const continuingRef = useRef(false)
    const wasBackgroundedRef = useRef(false)

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
        setBusyLocation(false)
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
            setShowLocationSettings(locationStatus.needsSettings)
        }
    }, [isNative, registerGeofenceFromApi])

    const loadGymFromApi = useCallback(async () => {
        try {
            const gym = await fetchUserGym()
            if (!gym) return
            setDisplayName(gym.name)
            setDisplayAddress(gym.address)
        } catch {
            /* API indisponible. */
        }
    }, [])

    useEffect(() => {
        setDisplayName(gymName)
        setDisplayAddress(gymAddress)
    }, [gymName, gymAddress])

    useEffect(() => {
        continuingRef.current = false
        wasBackgroundedRef.current = false
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

    const canContinue =
        notificationsOn && (!showLocationRow || locationOn)

    const handleContinue = () => {
        if (!canContinue || continuingRef.current) return
        continuingRef.current = true
        onContinue()
    }

    const handleSkip = () => {
        if (continuingRef.current) return
        continuingRef.current = true
        onContinue()
    }

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
            const { status } = await promptGymGeofenceLocationAccess({
                preferSettings: showLocationSettings,
            })
            if (status.ready) {
                await registerGeofenceFromApi()
                setLocationOn(true)
                setShowLocationSettings(false)
                return
            }
            setLocationOn(false)
            setShowLocationSettings(status.needsSettings)
        } finally {
            setBusyLocation(false)
        }
    }

    return (
        <OnboardingStepLayout>
            <StepCard
                className={onboardingStepCardClassName}
                title={UI.gymOnboardingPermissionsTitle}
            >
                <OnboardingReveal delayMs={80}>
                    <p className="text-sm text-muted-foreground">
                        {isNative
                            ? UI.gymOnboardingPermissionsBody
                            : isDevWebPreview
                                ? UI.gymOnboardingPermissionsBody
                                : UI.gymOnboardingPermissionsBodyWeb}
                    </p>
                </OnboardingReveal>
                <OnboardingReveal delayMs={140}>
                    {displayName.trim() ? (
                        <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
                            <p className="font-semibold">{displayName}</p>
                            {displayAddress ? (
                                <p className="mt-1 text-sm text-muted-foreground">{displayAddress}</p>
                            ) : null}
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="mt-3 w-full"
                                disabled={busyNotifications || busyLocation}
                                onClick={onChangeGym}
                            >
                                {UI.gymOnboardingWaitGymChange}
                            </Button>
                        </div>
                    ) : null}
                </OnboardingReveal>

                <div className="space-y-3">
                    <OnboardingReveal delayMs={200}>
                        <GymOnboardingPermissionRow
                            icon={Bell}
                            label={UI.gymOnboardingPermissionsNotificationsLabel}
                            hint={UI.gymOnboardingPermissionsNotificationsHint}
                            checked={notificationsOn}
                            busy={busyNotifications}
                            onCheckedChange={(checked) => void handleNotificationsToggle(checked)}
                        />
                    </OnboardingReveal>
                    {showLocationRow ? (
                        <OnboardingReveal delayMs={280}>
                            <GymOnboardingPermissionRow
                                icon={MapPin}
                                label={UI.gymOnboardingPermissionsLocationLabel}
                                hint={UI.gymOnboardingPermissionsLocationHint}
                                checked={locationOn}
                                busy={busyLocation}
                                onCheckedChange={(checked) => void handleLocationToggle(checked)}
                            />
                        </OnboardingReveal>
                    ) : (
                        <OnboardingReveal delayMs={280}>
                            <p className="text-xs text-muted-foreground">
                                {UI.gymOnboardingWebOnly}
                            </p>
                        </OnboardingReveal>
                    )}
                </div>

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
                <div className="space-y-2">
                    <OnboardingReveal delayMs={400}>
                        <Button
                            variant="accent"
                            className="w-full"
                            disabled={!canContinue || busyNotifications || busyLocation}
                            onClick={handleContinue}
                        >
                            {UI.continue}
                        </Button>
                    </OnboardingReveal>
                    <OnboardingReveal delayMs={480}>
                        <Button
                            variant="secondary"
                            className="w-full"
                            disabled={busyNotifications || busyLocation}
                            onClick={handleSkip}
                        >
                            {UI.gymOnboardingPermissionsSkip}
                        </Button>
                    </OnboardingReveal>
                </div>
            </StepCard>
        </OnboardingStepLayout>
    )
}
