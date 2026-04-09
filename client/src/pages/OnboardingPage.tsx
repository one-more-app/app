import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { popularExercises } from '@/data/popular-exercises'
import { useAuth } from '@/hooks/use-auth'
import { getExercisePopularityRank } from '@/lib/exercise-popularity'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import { CARDIO_EQUIPMENT, getExerciseImageUrl } from '@/lib/exercisedb'
import { signInWithOAuth } from '@/lib/oauth'
import {
    addTrackedExercise,
    getUserProfile,
    hasPersistedUserProfile,
    isOnboardingFirstExercisePending,
    markOnboardingDone,
    needsOnboarding,
    removeTrackedExercise,
    savePerformance,
    setOnboardingFirstExercisePending,
    setUserProfile,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { ExerciseDBExercise } from '@/types'
import { Capacitor } from '@capacitor/core'
import {
    ArrowLeft,
    Dumbbell,
    Mars,
    Ruler,
    Venus,
    VenusAndMars,
    Weight,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const BODY_TOTAL = 3

function exerciseDisplayName(ex: ExerciseDBExercise): string {
    const fr = (ex as { nameFr?: string }).nameFr?.trim()
    return fr || ex.name
}

function isPopularExerciseName(name: string): boolean {
    const r = getExercisePopularityRank(name)
    return Number.isFinite(r) && r < 90
}

function OnboardingGenderRadios({
    value,
    onChange,
}: {
    value: 'male' | 'female'
    onChange: (v: 'male' | 'female') => void
}) {
    const choices: {
        id: 'male' | 'female'
        label: string
        Icon: typeof Mars
    }[] = [
            { id: 'male', label: UI.male, Icon: Mars },
            { id: 'female', label: UI.female, Icon: Venus },
        ]
    return (
        <div
            className="grid grid-cols-2 gap-3"
            role="radiogroup"
            aria-label={UI.gender}
        >
            {choices.map(({ id, label, Icon }) => {
                const selected = value === id
                return (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(id)}
                        className={cn(
                            'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            selected
                                ? 'border-accent bg-accent/15 shadow-md ring-2 ring-accent/40'
                                : 'border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-border',
                        )}
                    >
                        <div
                            className={cn(
                                'flex size-16 items-center justify-center rounded-full bg-muted/50 text-foreground/80',
                                selected &&
                                'bg-accent/30 text-accent-foreground scale-[1.02]',
                            )}
                        >
                            <Icon className="size-9 stroke-[1.75]" aria-hidden />
                        </div>
                        <span className="text-sm font-semibold font-one-more uppercase tracking-wide">
                            {label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

function OnboardingPage() {
    const navigate = useNavigate()
    const auth = useAuth()
    const isNativePlatform = Capacitor.isNativePlatform()
    const [searchParams] = useSearchParams()
    const rawStep = searchParams.get('step')
    const step =
        rawStep === 'body' ? 'body' : rawStep === 'exercise' ? 'exercise' : 'intro'
    const bodyQRaw = searchParams.get('bodyQ')
    const bodyQ = Math.min(
        BODY_TOTAL - 1,
        Math.max(0, Number.parseInt(bodyQRaw ?? '0', 10) || 0),
    )

    const [isBusy, setIsBusy] = useState(false)
    const [exerciseSearch, setExerciseSearch] = useState('')
    const [firstPerfDrawerOpen, setFirstPerfDrawerOpen] = useState(false)
    const [pendingFirstPerfExercise, setPendingFirstPerfExercise] =
        useState<ExerciseDBExercise | null>(null)
    const firstPerfSessionRef = useRef<{ trackedId: string | null; saved: boolean }>({
        trackedId: null,
        saved: false,
    })

    const goBody = (q = 0) => {
        navigate(`/onboarding?step=body&bodyQ=${q}`, { replace: true })
    }

    const [weightKg, setWeightKg] = useState(75)
    const [heightCm, setHeightCm] = useState(175)
    const [gender, setGender] = useState<'male' | 'female'>('male')
    useEffect(() => {
        if (!needsOnboarding()) {
            navigate('/home', { replace: true })
            return
        }
        if (
            isOnboardingFirstExercisePending() &&
            step !== 'exercise' &&
            step !== 'body'
        ) {
            navigate('/onboarding?step=exercise', { replace: true })
        }
    }, [navigate, step])

    useEffect(() => {
        if (step !== 'body') return
        if (!hasPersistedUserProfile()) return
        const p = getUserProfile()
        setGender(p.gender)
        setWeightKg(p.weightKg)
        setHeightCm(p.heightCm)
    }, [step])

    const canAdvanceWeight = weightKg >= 30 && weightKg <= 300
    const canAdvanceHeight = heightCm >= 100 && heightCm <= 250

    const handleOAuth = async (provider: 'google' | 'apple') => {
        if (isBusy) return
        setIsBusy(true)
        try {
            auth.clearError()
            const session = await signInWithOAuth(provider)
            auth.acceptSession(session)
            goBody(0)
        } catch (e) {
            auth.setError(e instanceof Error ? e.message : 'Connexion impossible')
        } finally {
            setIsBusy(false)
        }
    }

    const finishBodyAndGoExercise = () => {
        if (!canAdvanceHeight) return
        setUserProfile({
            weightKg,
            heightCm,
            gender,
        })
        setOnboardingFirstExercisePending(true)
        navigate('/onboarding?step=exercise', { replace: true })
    }

    const advanceBody = () => {
        if (bodyQ === 1 && !canAdvanceWeight) return
        if (bodyQ === 2) {
            finishBodyAndGoExercise()
            return
        }
        goBody(bodyQ + 1)
    }

    const backBody = () => {
        if (bodyQ <= 0) {
            navigate('/onboarding', { replace: true })
            return
        }
        goBody(bodyQ - 1)
    }

    const handlePickExercise = (ex: ExerciseDBExercise) => {
        const trackedId = `api-${ex.id}`
        firstPerfSessionRef.current = { trackedId, saved: false }
        addTrackedExercise({
            id: trackedId,
            exerciseId: ex.id,
            name: ex.name,
            originalName: ex.name,
            bodyPart: ex.bodyPart,
            target: ex.target,
            equipment: ex.equipment,
            gifUrl: ex.gifUrl,
            isCustom: false,
        })
        setPendingFirstPerfExercise(ex)
        setFirstPerfDrawerOpen(true)
    }

    const handleFirstPerfDrawerOpenChange = (open: boolean) => {
        if (!open) {
            const { trackedId, saved } = firstPerfSessionRef.current
            if (trackedId && !saved) {
                removeTrackedExercise(trackedId)
            }
            if (!saved) {
                firstPerfSessionRef.current = { trackedId: null, saved: false }
                setPendingFirstPerfExercise(null)
            }
        }
        setFirstPerfDrawerOpen(open)
    }

    const handleFirstPerfSave = (weight: number, reps: number) => {
        const trackedId = firstPerfSessionRef.current.trackedId
        if (!trackedId) return
        savePerformance(trackedId, weight, reps)
        firstPerfSessionRef.current.saved = true
        markOnboardingDone()
        setPendingFirstPerfExercise(null)
        setFirstPerfDrawerOpen(false)
        firstPerfSessionRef.current = { trackedId: null, saved: false }
        navigate(`/exercise/${trackedId}?tour=onboarding`, { replace: true })
    }

    const handleSkipExercise = () => {
        markOnboardingDone()
        navigate('/home', { replace: true })
    }

    const filteredExercises = useMemo(() => {
        const q = exerciseSearch.trim().toLowerCase()
        const apiQ = q ? translateSearchQueryToEnglish(exerciseSearch.trim()).toLowerCase() : ''
        let list = popularExercises.filter(
            (ex) =>
                ex.bodyPart !== 'cardio' &&
                !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)),
        )
        if (q || apiQ) {
            list = list.filter((ex) => {
                const display = exerciseDisplayName(ex).toLowerCase()
                const matchFr = q && display.includes(q)
                const matchEn = apiQ && ex.name.toLowerCase().includes(apiQ)
                const matchEnRaw = q && ex.name.toLowerCase().includes(q)
                return matchFr || matchEn || matchEnRaw
            })
        }
        return [...list].sort((a, b) => {
            const ra = getExercisePopularityRank(a.name)
            const rb = getExercisePopularityRank(b.name)
            const fa = Number.isFinite(ra) ? ra : 9999
            const fb = Number.isFinite(rb) ? rb : 9999
            if (fa !== fb) return fa - fb
            return exerciseDisplayName(a).localeCompare(exerciseDisplayName(b), 'fr', {
                sensitivity: 'base',
            })
        })
    }, [exerciseSearch])

    const stepIndicator = UI.onboardingStepIndicator
        .replace('{current}', String(bodyQ + 1))
        .replace('{total}', String(BODY_TOTAL))
    const bodyProgressPercent = ((bodyQ + 1) / BODY_TOTAL) * 100

    const backExercise = () => {
        if (firstPerfDrawerOpen) return
        navigate(`/onboarding?step=body&bodyQ=${BODY_TOTAL - 1}`, { replace: true })
    }

    const pendingTrackedId = pendingFirstPerfExercise
        ? `api-${pendingFirstPerfExercise.id}`
        : ''

    return (
        <div className="relative min-h-screen bg-background overflow-hidden">
            <video
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                src="/onboarding-bg.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                poster="/logo.png"
            />

            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            <div className="pointer-events-none absolute -top-20 -left-20 size-64 rounded-full bg-accent/20 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute bottom-8 -right-20 size-72 rounded-full bg-primary/20 blur-3xl animate-pulse [animation-delay:700ms]" />

            {step === 'intro' ? (
                <div className="relative z-10 flex min-h-screen flex-col">
                    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-10 pb-6">
                        <div className="space-y-5 rounded-3xl bg-black/30 p-6 backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                            <div className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent">
                                <span>One More Method</span>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl sm:text-5xl leading-tight font-one-more font-semibold text-white uppercase italic">
                                    {UI.onboardingTitle}
                                </h1>
                                <p className="text-md text-white/80">
                                    {UI.onboardingDescription}
                                </p>
                            </div>
                        </div>

                        {auth.lastError && (
                            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {auth.lastError}
                            </div>
                        )}
                    </main>

                    <div className="px-4 pb-4 mt-auto">
                        <div className="mx-auto max-w-2xl space-y-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
                            <Button asChild className="w-full" disabled={isBusy}>
                                <Link
                                    to={`/auth?mode=register&redirect=${encodeURIComponent(
                                        '/onboarding?step=body&bodyQ=0',
                                    )}`}
                                >
                                    {UI.createAccount}
                                </Link>
                            </Button>
                            {isNativePlatform ? (
                                <>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        disabled={isBusy}
                                        onClick={() => void handleOAuth('google')}
                                    >
                                        {UI.continueWithGoogle}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        disabled={isBusy}
                                        onClick={() => void handleOAuth('apple')}
                                    >
                                        {UI.continueWithApple}
                                    </Button>
                                </>
                            ) : null}
                            <Button
                                variant="ghost"
                                className="w-full text-white"
                                disabled={isBusy}
                                onClick={() => goBody(0)}
                            >
                                {UI.later}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : step === 'body' ? (
                <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
                    <Card
                        key={`body-${bodyQ}`}
                        className="w-full border-border/80 bg-card/95 backdrop-blur-sm shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                    >
                        <CardHeader className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 -ml-2"
                                    onClick={backBody}
                                    aria-label={UI.back}
                                >
                                    <ArrowLeft className="size-5" />
                                </Button>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {stepIndicator}
                                </p>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
                                    style={{ width: `${bodyProgressPercent}%` }}
                                />
                            </div>
                            <CardTitle className="text-xl">{UI.onboardingTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {bodyQ === 0 && (
                                <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <VenusAndMars className="size-4 text-accent-foreground" />
                                            {UI.gender}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {UI.onboardingQuestionGenderHint}
                                        </p>
                                    </div>
                                    <OnboardingGenderRadios
                                        value={gender}
                                        onChange={setGender}
                                    />
                                </div>
                            )}

                            {bodyQ === 1 && (
                                <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <Weight className="size-4 text-accent-foreground" />
                                            {UI.bodyWeight}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {UI.onboardingQuestionWeightHint}
                                        </p>
                                    </div>
                                    <HorizontalWheelPicker
                                        label={UI.bodyWeight}
                                        unit=""
                                        min={30}
                                        max={300}
                                        step={0.5}
                                        value={weightKg}
                                        onChange={setWeightKg}
                                    />
                                </div>
                            )}

                            {bodyQ === 2 && (
                                <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <Ruler className="size-4 text-accent-foreground" />
                                            {UI.height}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {UI.onboardingQuestionHeightHint}
                                        </p>
                                    </div>
                                    <HorizontalWheelPicker
                                        label={UI.height}
                                        unit=""
                                        min={100}
                                        max={250}
                                        step={1}
                                        value={heightCm}
                                        onChange={setHeightCm}
                                    />
                                </div>
                            )}

                            <Button
                                onClick={advanceBody}
                                className="w-full"
                                disabled={
                                    (bodyQ === 1 && !canAdvanceWeight) ||
                                    (bodyQ === 2 && !canAdvanceHeight)
                                }
                            >
                                {bodyQ === BODY_TOTAL - 1 ? UI.continue : UI.next}
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            ) : (
                <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
                    {pendingFirstPerfExercise ? (
                        <AddPerfDrawer
                            open={firstPerfDrawerOpen}
                            onOpenChange={handleFirstPerfDrawerOpenChange}
                            exercise={{
                                id: pendingTrackedId,
                                name: exerciseDisplayName(pendingFirstPerfExercise),
                                originalName: pendingFirstPerfExercise.name,
                                equipment: pendingFirstPerfExercise.equipment,
                                target: pendingFirstPerfExercise.target,
                            }}
                            initialWeight={20}
                            initialReps={8}
                            onSave={handleFirstPerfSave}
                        />
                    ) : null}

                    <Card className="w-full border-border/80 bg-card/95 backdrop-blur-sm shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                        <CardHeader className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 -ml-2"
                                    onClick={backExercise}
                                    disabled={firstPerfDrawerOpen}
                                    aria-label={UI.back}
                                >
                                    <ArrowLeft className="size-5" />
                                </Button>
                            </div>
                            <CardTitle className="text-xl">
                                <span className="inline-flex items-center gap-2">
                                    <Dumbbell className="size-5 text-accent-foreground" />
                                    {UI.onboardingFirstExerciseTitle}
                                </span>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {UI.onboardingFirstExerciseDescription}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder={UI.onboardingFirstExerciseSearch}
                                value={exerciseSearch}
                                onChange={(e) => setExerciseSearch(e.target.value)}
                                aria-label={UI.searchExercise}
                            />

                            <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/60">
                                {filteredExercises.length === 0 ? (
                                    <p className="p-4 text-sm text-muted-foreground">
                                        {UI.noExerciseFound}
                                    </p>
                                ) : (
                                    filteredExercises.map((ex) => {
                                        const popular = isPopularExerciseName(ex.name)
                                        return (
                                            <button
                                                key={ex.id}
                                                type="button"
                                                disabled={
                                                    firstPerfDrawerOpen
                                                }
                                                onClick={() => handlePickExercise(ex)}
                                                className="flex w-full items-center gap-3 p-3 text-left transition-all duration-200 hover:bg-muted/60 hover:translate-x-0.5 disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                {ex.gifUrl ? (
                                                    <img
                                                        src={getExerciseImageUrl(ex.gifUrl)}
                                                        alt=""
                                                        className="size-14 shrink-0 rounded-lg object-cover bg-muted"
                                                        onError={(e) => {
                                                            ; (e.target as HTMLImageElement).style.display =
                                                                'none'
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="size-14 shrink-0 rounded-lg bg-muted" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-medium leading-tight">
                                                            {exerciseDisplayName(ex)}
                                                        </span>
                                                        {popular ? (
                                                            <Badge
                                                                variant="secondary"
                                                                className="shrink-0 text-xs font-normal"
                                                            >
                                                                {UI.popularExercise}
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={firstPerfDrawerOpen}
                                onClick={handleSkipExercise}
                            >
                                {UI.onboardingSkipFirstExercise}
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            )}
        </div>
    )
}

export default OnboardingPage
