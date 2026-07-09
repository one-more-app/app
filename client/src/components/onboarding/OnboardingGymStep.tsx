import {
    onboardingStepCardClassName,
    OnboardingReveal,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import { GymSearchPicker } from '@/components/gyms/GymSearchPicker'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { useMutateUserGym } from '@/hooks/use-user-gym-data'
import {
    getCurrentGymCoords,
    requestGymLocationPermission,
} from '@/lib/gym-geolocation'
import {
    findGymFromLocation,
    fetchUserGym,
    isWithinGymRadius,
    upsertUserGym,
    type GymPlace,
} from '@/lib/gyms-api'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { Loader2 } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'

type GymSubStep = 'question' | 'locating' | 'confirm' | 'search'

type GymSearchView = 'list' | 'map'

type OnboardingGymStepProps = {
    onGymSaved: () => void | Promise<void>
    fromSettings?: boolean
    embedded?: boolean
    settingsPickerTitle?: string
    onCancel?: () => void
}

function GymStepShell({
    embedded,
    centered,
    children,
}: {
    embedded?: boolean
    centered?: boolean
    children: ReactNode
}) {
    if (embedded) {
        return (
            <div
                className={
                    centered
                        ? 'flex flex-col items-center justify-center gap-3 py-8'
                        : undefined
                }
            >
                {children}
            </div>
        )
    }
    return (
        <OnboardingStepLayout centered={centered}>{children}</OnboardingStepLayout>
    )
}

export function OnboardingGymStep({
    onGymSaved,
    fromSettings = false,
    embedded = false,
    settingsPickerTitle,
    onCancel,
}: OnboardingGymStepProps) {
    const mutateUserGym = useMutateUserGym()
    const isNative = Capacitor.isNativePlatform()
    const [subStep, setSubStep] = useState<GymSubStep>(
        fromSettings ? 'search' : 'question',
    )
    const [candidate, setCandidate] = useState<GymPlace | null>(null)
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
        null,
    )
    const [searchQuery, setSearchQuery] = useState('')
    const [searchView, setSearchView] = useState<GymSearchView>('list')
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchPickerKey, setSearchPickerKey] = useState(0)

    const saveGym = useCallback(
        async (place: GymPlace, coords: { lat: number; lng: number } | null) => {
            setError(null)
            try {
                const existing = fromSettings ? await fetchUserGym().catch(() => null) : null
                const inZone =
                    coords != null
                        ? isWithinGymRadius(coords.lat, coords.lng, {
                              lat: place.lat,
                              lng: place.lng,
                              radiusM: 120,
                          })
                        : false

                await upsertUserGym({
                    placeId: place.placeId,
                    name: place.name,
                    address: place.address,
                    lat: place.lat,
                    lng: place.lng,
                    radiusM: 120,
                    onboardingGymPending: fromSettings
                        ? (existing?.onboardingGymPending ?? false)
                        : !inZone,
                    geofenceEnabled: existing?.geofenceEnabled ?? true,
                })

                await mutateUserGym()
                await onGymSaved()
            } catch {
                setError(UI.gymSettingsSaveError)
            }
        },
        [fromSettings, mutateUserGym, onGymSaved],
    )

    const handleAtGym = async () => {
        if (!isNative) {
            setError(UI.gymOnboardingWebSearch)
            setSubStep('search')
            return
        }
        setSubStep('locating')
        setError(null)
        const granted = await requestGymLocationPermission()
        if (!granted) {
            setError('Permission de localisation refusée.')
            setSubStep('question')
            return
        }
        try {
            const coords = await getCurrentGymCoords()
            setUserCoords(coords)
            const found = await findGymFromLocation(coords.lat, coords.lng)
            if (!found) {
                setError('Aucune salle détectée à proximité. Cherche-la par nom.')
                setSubStep('search')
                return
            }
            setCandidate(found)
            setSubStep('confirm')
        } catch {
            setError('Impossible d\'obtenir ta position.')
            setSubStep('question')
        }
    }

    if (subStep === 'question') {
        return (
            <GymStepShell embedded={embedded}>
                <StepCard
                    className={onboardingStepCardClassName}
                    title={UI.gymOnboardingTitle}
                    onBack={fromSettings ? onCancel : undefined}
                    backLabel={UI.back}
                >
                    <OnboardingReveal delayMs={80}>
                    <p className="text-sm text-muted-foreground">
                        {UI.gymOnboardingHint}
                    </p>
                    </OnboardingReveal>
                    {error && (
                        <OnboardingReveal delayMs={120}>
                        <p className="text-sm text-destructive">{error}</p>
                        </OnboardingReveal>
                    )}
                    <OnboardingReveal delayMs={160}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button variant="accent" className="w-full" onClick={() => void handleAtGym()}>
                            {UI.gymOnboardingYes}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setSubStep('search')
                                setError(null)
                            }}
                        >
                            {UI.gymOnboardingNo}
                        </Button>
                    </div>
                    </OnboardingReveal>
                </StepCard>
            </GymStepShell>
        )
    }

    if (subStep === 'locating') {
        return (
            <GymStepShell embedded={embedded} centered>
                <OnboardingReveal>
                <Loader2 className="size-8 animate-spin text-accent" aria-hidden />
                </OnboardingReveal>
                <OnboardingReveal delayMs={120}>
                <p className="text-sm text-muted-foreground">
                    {UI.gymOnboardingLocationWhy}
                </p>
                </OnboardingReveal>
            </GymStepShell>
        )
    }

    if (subStep === 'confirm' && candidate) {
        return (
            <GymStepShell embedded={embedded}>
                <StepCard
                    className={onboardingStepCardClassName}
                    title={UI.gymOnboardingConfirmTitle}
                >
                    <OnboardingReveal delayMs={80}>
                    <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                        <p className="font-semibold">{candidate.name}</p>
                        {candidate.address && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {candidate.address}
                            </p>
                        )}
                    </div>
                    </OnboardingReveal>
                    {error && (
                        <OnboardingReveal delayMs={120}>
                        <p className="text-sm text-destructive">{error}</p>
                        </OnboardingReveal>
                    )}
                    <OnboardingReveal delayMs={200}>
                    <Button
                        variant="accent"
                        className="w-full"
                        onClick={() => void saveGym(candidate, userCoords)}
                    >
                        {UI.continue}
                    </Button>
                    </OnboardingReveal>
                    <OnboardingReveal delayMs={280}>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setSearchQuery(candidate.name)
                            setSearchView('map')
                            setSelectedPlaceId(candidate.placeId)
                            setSearchPickerKey((key) => key + 1)
                            setSubStep('search')
                        }}
                    >
                        {UI.gymSettingsChange}
                    </Button>
                    </OnboardingReveal>
                </StepCard>
            </GymStepShell>
        )
    }

    return (
        <GymStepShell embedded={embedded}>
            <StepCard
                className={onboardingStepCardClassName}
                title={
                    fromSettings
                        ? (settingsPickerTitle ?? UI.gymSettingsChange)
                        : UI.gymOnboardingNo
                }
                onBack={fromSettings ? onCancel : () => setSubStep('question')}
                backLabel={UI.back}
            >
                <GymSearchPicker
                    key={searchPickerKey}
                    animated
                    fromSettings={fromSettings}
                    initialSearchQuery={searchQuery}
                    initialSelectedPlaceId={selectedPlaceId}
                    initialSearchView={searchView}
                    onGymSaved={onGymSaved}
                />
            </StepCard>
        </GymStepShell>
    )
}
