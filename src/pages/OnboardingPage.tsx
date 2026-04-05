import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { popularExercises } from '@/data/popular-exercises'
import { useAuth } from '@/hooks/use-auth'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import { CARDIO_EQUIPMENT, getExerciseImageUrl } from '@/lib/exercisedb'
import { getExercisePopularityRank } from '@/lib/exercise-popularity'
import { signInWithOAuth } from '@/lib/oauth'
import {
    addTrackedExercise,
    getUserProfile,
    hasPersistedUserProfile,
    isOnboardingFirstExercisePending,
    markOnboardingDone,
    needsOnboarding,
    setOnboardingFirstExercisePending,
    setUserProfile,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

export function OnboardingPage() {
    const navigate = useNavigate()
    const auth = useAuth()
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

    const goBody = (q = 0) => {
        navigate(`/onboarding?step=body&bodyQ=${q}`, { replace: true })
    }

    const [weightKg, setWeightKg] = useState('')
    const [heightCm, setHeightCm] = useState('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [hasTriedAdvance, setHasTriedAdvance] = useState(false)

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
        setWeightKg(String(p.weightKg))
        setHeightCm(String(p.heightCm))
    }, [step])

    const parsed = useMemo(() => {
        const w = Number.parseFloat(weightKg)
        const h = Number.parseFloat(heightCm)
        return {
            weightOk: Number.isFinite(w) && w > 0,
            heightOk: Number.isFinite(h) && h > 0,
            weight: w,
            height: h,
        }
    }, [weightKg, heightCm])

    const canAdvanceWeight = parsed.weightOk
    const canAdvanceHeight = parsed.heightOk

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
        setHasTriedAdvance(true)
        if (!canAdvanceHeight) return
        setUserProfile({
            weightKg: parsed.weight,
            heightCm: parsed.height,
            gender,
        })
        setOnboardingFirstExercisePending(true)
        navigate('/onboarding?step=exercise', { replace: true })
    }

    const advanceBody = () => {
        setHasTriedAdvance(true)
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
        addTrackedExercise({
            exerciseId: ex.id,
            name: ex.name,
            originalName: ex.name,
            bodyPart: ex.bodyPart,
            target: ex.target,
            equipment: ex.equipment,
            gifUrl: ex.gifUrl,
            isCustom: false,
        })
        markOnboardingDone()
        navigate(`/exercise/${trackedId}`, { replace: true })
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

    const backExercise = () => {
        navigate(`/onboarding?step=body&bodyQ=${BODY_TOTAL - 1}`, { replace: true })
    }

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

            {step === 'intro' ? (
                <div className="relative z-10 flex min-h-screen flex-col">
                    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-10 pb-6 space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-one-more font-semibold text-foreground uppercase italic">
                                {UI.onboardingTitle}
                            </h1>
                            <p className="text-sm font-one-more italic  uppercase text-muted-foreground">
                                {UI.onboardingDescription}
                            </p>
                        </div>

                        {auth.lastError && (
                            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {auth.lastError}
                            </div>
                        )}
                    </main>

                    <div className="px-4 pb-4 mt-auto">
                        <div className="mx-auto max-w-2xl space-y-3">
                            <Button asChild className="w-full" disabled={isBusy}>
                                <Link
                                    to={`/auth?mode=register&redirect=${encodeURIComponent(
                                        '/onboarding?step=body&bodyQ=0',
                                    )}`}
                                >
                                    {UI.createAccount}
                                </Link>
                            </Button>
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
                            <Button
                                variant="ghost"
                                className="w-full"
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
                    <Card className="w-full border-border/80 bg-card/95 backdrop-blur-sm">
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
                            <CardTitle className="text-xl">{UI.onboardingTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {bodyQ === 0 && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium">{UI.gender}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {UI.onboardingQuestionGenderHint}
                                        </p>
                                    </div>
                                    <Select
                                        value={gender}
                                        onValueChange={(v) => setGender(v as 'male' | 'female')}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{UI.male}</SelectItem>
                                            <SelectItem value="female">{UI.female}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {bodyQ === 1 && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium">{UI.bodyWeight}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {UI.onboardingQuestionWeightHint}
                                        </p>
                                    </div>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        min={30}
                                        max={300}
                                        step={0.5}
                                        value={weightKg}
                                        onChange={(e) => setWeightKg(e.target.value)}
                                        aria-invalid={hasTriedAdvance && !parsed.weightOk}
                                    />
                                </div>
                            )}

                            {bodyQ === 2 && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium">{UI.height}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {UI.onboardingQuestionHeightHint}
                                        </p>
                                    </div>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={100}
                                        max={250}
                                        step={1}
                                        value={heightCm}
                                        onChange={(e) => setHeightCm(e.target.value)}
                                        aria-invalid={hasTriedAdvance && !parsed.heightOk}
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
                    <Card className="w-full border-border/80 bg-card/95 backdrop-blur-sm">
                        <CardHeader className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 -ml-2"
                                    onClick={backExercise}
                                    aria-label={UI.back}
                                >
                                    <ArrowLeft className="size-5" />
                                </Button>
                            </div>
                            <CardTitle className="text-xl">
                                {UI.onboardingFirstExerciseTitle}
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
                                                onClick={() => handlePickExercise(ex)}
                                                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/60"
                                            >
                                                {ex.gifUrl ? (
                                                    <img
                                                        src={getExerciseImageUrl(ex.gifUrl)}
                                                        alt=""
                                                        className="size-14 shrink-0 rounded-lg object-cover bg-muted"
                                                        onError={(e) => {
                                                            ;(e.target as HTMLImageElement).style.display =
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
