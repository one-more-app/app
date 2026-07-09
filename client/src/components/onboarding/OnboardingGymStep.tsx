import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    findGymFromLocation,
    isWithinGymRadius,
    searchGyms,
    upsertUserGym,
    type GymPlace,
} from '@/lib/gyms-api'
import { registerGymGeofence } from '@/lib/gym-geofence'
import {
    setGymSetupDone,
    setOnboardingFirstExercisePending,
    setOnboardingGymPending,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { Loader2, MapPin, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type GymSubStep =
    | 'question'
    | 'locating'
    | 'confirm'
    | 'search'
    | 'saving'

type OnboardingGymStepProps = {
    onCompleteAtGym: () => void
    onDeferred: (gymName: string) => void
    onSkip: () => void
}

function formatDistance(distanceM: number | null): string {
    if (distanceM == null) return ''
    return UI.gymDistanceM.replace('{distance}', String(distanceM))
}

async function requestLocationPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        if (!navigator.geolocation) return false
        return true
    }
    const current = await Geolocation.checkPermissions()
    if (current.location === 'granted') return true
    const requested = await Geolocation.requestPermissions()
    return requested.location === 'granted'
}

async function getCurrentCoords(): Promise<{ lat: number; lng: number }> {
    if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
        })
        return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    }
    return await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                }),
            reject,
            { enableHighAccuracy: true, timeout: 15000 },
        )
    })
}

export function OnboardingGymStep({
    onCompleteAtGym,
    onDeferred,
    onSkip,
}: OnboardingGymStepProps) {
    const isNative = Capacitor.isNativePlatform()
    const [subStep, setSubStep] = useState<GymSubStep>('question')
    const [candidate, setCandidate] = useState<GymPlace | null>(null)
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
        null,
    )
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<GymPlace[]>([])
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const saveGym = useCallback(
        async (place: GymPlace, coords: { lat: number; lng: number } | null) => {
            setSubStep('saving')
            setError(null)
            try {
                const inZone =
                    coords != null
                        ? isWithinGymRadius(coords.lat, coords.lng, {
                              lat: place.lat,
                              lng: place.lng,
                              radiusM: 120,
                          })
                        : false

                const gym = await upsertUserGym({
                    placeId: place.placeId,
                    name: place.name,
                    address: place.address,
                    lat: place.lat,
                    lng: place.lng,
                    radiusM: 120,
                    onboardingGymPending: !inZone,
                    geofenceEnabled: true,
                })

                setGymSetupDone(true)

                if (isNative && gym.geofenceEnabled) {
                    await registerGymGeofence({
                        lat: gym.lat,
                        lng: gym.lng,
                        radiusM: gym.radiusM,
                        gymName: gym.name,
                        onboardingGymPending: gym.onboardingGymPending,
                    })
                }

                if (inZone) {
                    setOnboardingGymPending(false)
                    setOnboardingFirstExercisePending(true)
                    onCompleteAtGym()
                } else {
                    setOnboardingGymPending(true)
                    onDeferred(gym.name)
                }
            } catch {
                setError('Impossible d\'enregistrer ta salle. Réessaie.')
                setSubStep(candidate ? 'confirm' : 'search')
            }
        },
        [candidate, isNative, onCompleteAtGym, onDeferred],
    )

    const handleAtGym = async () => {
        if (!isNative) {
            toast(UI.gymOnboardingWebOnly)
            onSkip()
            return
        }
        setSubStep('locating')
        setError(null)
        const granted = await requestLocationPermission()
        if (!granted) {
            setError('Permission de localisation refusée.')
            setSubStep('question')
            return
        }
        try {
            const coords = await getCurrentCoords()
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

    const runSearch = useCallback(async () => {
        setSearching(true)
        setError(null)
        try {
            let coords = userCoords
            if (!coords && isNative) {
                const granted = await requestLocationPermission()
                if (granted) {
                    coords = await getCurrentCoords()
                    setUserCoords(coords)
                }
            }
            const items = await searchGyms({
                q: searchQuery.trim() || undefined,
                lat: coords?.lat,
                lng: coords?.lng,
            })
            setResults(items)
            if (items.length === 0) {
                setError(UI.gymOnboardingNoResults)
            }
        } catch {
            setError(UI.gymOnboardingNoResults)
            setResults([])
        } finally {
            setSearching(false)
        }
    }, [isNative, searchQuery, userCoords])

    useEffect(() => {
        if (subStep !== 'search') return
        if (!searchQuery.trim()) return
        const timer = window.setTimeout(() => {
            void runSearch()
        }, 300)
        return () => window.clearTimeout(timer)
    }, [searchQuery, subStep, runSearch])

    if (subStep === 'question') {
        return (
            <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
                <StepCard
                    animated
                    className="shadow-2xl"
                    title={UI.gymOnboardingTitle}
                >
                    <p className="text-sm text-muted-foreground">
                        {UI.gymOnboardingHint}
                    </p>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
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
                    <button
                        type="button"
                        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                        onClick={onSkip}
                    >
                        {UI.gymOnboardingSkip}
                    </button>
                </StepCard>
            </main>
        )
    }

    if (subStep === 'locating' || subStep === 'saving') {
        return (
            <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16">
                <Loader2 className="size-8 animate-spin text-accent" aria-hidden />
                <p className="text-sm text-muted-foreground">
                    {subStep === 'locating'
                        ? UI.gymOnboardingLocationWhy
                        : UI.continue}
                </p>
            </main>
        )
    }

    if (subStep === 'confirm' && candidate) {
        return (
            <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
                <StepCard
                    animated
                    className="shadow-2xl"
                    title={UI.gymOnboardingConfirmTitle}
                >
                    <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                        <p className="font-semibold">{candidate.name}</p>
                        {candidate.address && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {candidate.address}
                            </p>
                        )}
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button
                        variant="accent"
                        className="w-full"
                        onClick={() => void saveGym(candidate, userCoords)}
                    >
                        {UI.continue}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setSubStep('search')
                            setSearchQuery(candidate.name)
                        }}
                    >
                        {UI.gymSettingsChange}
                    </Button>
                </StepCard>
            </main>
        )
    }

    return (
        <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
            <StepCard
                animated
                className="shadow-2xl"
                title={UI.gymOnboardingNo}
                onBack={() => setSubStep('question')}
                backLabel={UI.back}
            >
                <p className="text-sm text-muted-foreground">
                    {UI.gymOnboardingHint}
                </p>
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={UI.gymOnboardingSearchPlaceholder}
                        className="pl-9"
                    />
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    disabled={searching}
                    onClick={() => void runSearch()}
                >
                    <MapPin className="mr-2 size-4" aria-hidden />
                    {UI.gymOnboardingSearchNearby}
                </Button>
                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {results.map((place) => (
                        <li key={place.placeId}>
                            <button
                                type="button"
                                className="w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-3 text-left transition-colors hover:bg-muted/40"
                                onClick={() => void saveGym(place, userCoords)}
                            >
                                <p className="font-medium">{place.name}</p>
                                {place.address && (
                                    <p className="text-sm text-muted-foreground">
                                        {place.address}
                                    </p>
                                )}
                                {place.distanceM != null && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistance(place.distanceM)}
                                    </p>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    type="button"
                    className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                    onClick={onSkip}
                >
                    {UI.gymOnboardingSkip}
                </button>
            </StepCard>
        </main>
    )
}
