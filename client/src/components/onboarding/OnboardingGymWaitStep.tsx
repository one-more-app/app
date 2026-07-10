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
    registerGymGeofenceIfPermitted,
    requestGymGeofencePermissions,
} from '@/lib/gym-geofence'
import {
    isGymWaitPermissionsReady,
    resolveGymWaitMonitoringBody,
} from '@/lib/gym-onboarding-wait-copy'
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
import { cn } from '@/lib/utils'
import { Capacitor } from '@capacitor/core'
import { Bell, Check, MapPin } from 'lucide-react'
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
    const isDevWebPreview = isGymPermissionsDevWebPreview()
    const showLocationRow = isGymPermissionsNativeContext('gym-wait')

    const [gymName, setGymName] = useState(initialGymName)
    const [gymAddress, setGymAddress] = useState(initialGymAddress)

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

    const permissionsReady = isGymWaitPermissionsReady({
        hasGym,
        notificationsOn,
        locationOn,
        isNative,
    })

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

                {permissionsReady ? (
                    <OnboardingReveal delayMs={240}>
                        <GymWaitMonitoringCard
                            gymName={gymName}
                            isNative={isNative}
                            showLocationRow={showLocationRow}
                        />
                    </OnboardingReveal>
                ) : (
                    <OnboardingReveal delayMs={240}>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm font-medium">
                                    {UI.gymOnboardingWaitRemindersSection}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {UI.gymOnboardingWaitRemindersPending}
                                </p>
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
                                    <p className="text-sm text-muted-foreground">
                                        {UI.gymOnboardingWebOnly}
                                    </p>
                                )}
                            </div>
                        </div>
                    </OnboardingReveal>
                )}

                {showLocationSettings ? (
                    <OnboardingReveal delayMs={300}>
                        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                {UI.gymOnboardingLocationDenied}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {UI.gymOnboardingLocationSettingsHint}
                            </p>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => void openGymGeofenceSettings()}
                            >
                                {UI.gymOnboardingLocationSettingsCta}
                            </Button>
                        </div>
                    </OnboardingReveal>
                ) : null}

                <OnboardingReveal delayMs={360}>
                    <GymWaitChoiceBlock />
                </OnboardingReveal>

                <OnboardingReveal delayMs={420}>
                    <Button
                        variant="accent"
                        className={cn('w-full', permissionsReady && 'mt-1')}
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
