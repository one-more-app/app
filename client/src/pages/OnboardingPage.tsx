import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { OnboardingVideoShell } from '@/components/OnboardingVideoShell'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { useUserProfileData } from '@/hooks/use-api-data'
import { useAuth } from '@/hooks/use-auth'
import { OnboardingGymStep } from '@/components/onboarding/OnboardingGymStep'
import { resolvePostAuthNavigation } from '@/lib/post-auth-navigation'
import {
    getOnboardingPostAuthRedirect,
    getUserProfile,
    hasPersistedUserProfile,
    markOnboardingDone,
    needsOnboarding,
    setOnboardingPostAuthRedirect,
    setGymSetupDone,
    setUserProfile,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { AuthPage } from '@/pages/AuthPage'
import {
    Mars,
    Venus
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'

const BODY_TOTAL = 3

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
                                'flex size-16 items-center justify-center text-foreground/80',
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
    const { mutate } = useSWRConfig()
    const auth = useAuth()
    const { data: profile } = useUserProfileData()
    const [searchParams] = useSearchParams()
    const rawStep = searchParams.get('step')
    const step =
        rawStep === 'body'
            ? 'body'
            : rawStep === 'account'
                ? 'account'
                : rawStep === 'gym'
                    ? 'gym'
                    : 'intro'
    const bodyQRaw = searchParams.get('bodyQ')
    const bodyQ = Math.min(
        BODY_TOTAL - 1,
        Math.max(0, Number.parseInt(bodyQRaw ?? '0', 10) || 0),
    )

    const goBody = (q = 0) => {
        navigate(`/onboarding?step=body&bodyQ=${q}`, { replace: true })
    }

    const [weightKg, setWeightKg] = useState(75)
    const [heightCm, setHeightCm] = useState(175)
    const [gender, setGender] = useState<'male' | 'female'>('male')
    useEffect(() => {
        if (!needsOnboarding()) {
            navigate(auth.status === 'authenticated' ? '/home' : '/auth', { replace: true })
        }
    }, [auth.status, navigate, step])

    useEffect(() => {
        if (step !== 'body') return
        const p = profile ?? (hasPersistedUserProfile() ? getUserProfile() : null)
        if (!p) return
        setGender(p.gender)
        setWeightKg(p.weightKg)
        setHeightCm(p.heightCm)
    }, [profile, step])

    const canAdvanceWeight = weightKg >= 30 && weightKg <= 300
    const canAdvanceHeight = heightCm >= 100 && heightCm <= 250

    const finishBodyAndContinue = async () => {
        if (!canAdvanceHeight) return
        setUserProfile({
            weightKg,
            heightCm,
            gender,
        })
        void mutate('profile')
        await finishOnboarding('/home')
    }

    const advanceBody = () => {
        if (bodyQ === 1 && !canAdvanceWeight) return
        if (bodyQ === 2) {
            void finishBodyAndContinue()
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

    const stepIndicator = UI.onboardingStepIndicator
        .replace('{current}', String(bodyQ + 1))
        .replace('{total}', String(BODY_TOTAL))
    const bodyProgressPercent = ((bodyQ + 1) / BODY_TOTAL) * 100

    const bodyStepTitle =
        bodyQ === 0
            ? UI.onboardingBodyTitleGender
            : bodyQ === 1
                ? UI.onboardingBodyTitleWeight
                : UI.onboardingBodyTitleHeight

    const finishOnboarding = async (nextPath: string) => {
        if (auth.status === 'authenticated') {
            setOnboardingPostAuthRedirect(null)
            markOnboardingDone()
            const resolvedPath = await resolvePostAuthNavigation(nextPath)
            navigate(resolvedPath, { replace: true })
            return
        }

        setOnboardingPostAuthRedirect(nextPath)
        const redirect = encodeURIComponent('/onboarding?step=account')
        navigate(`/onboarding?step=account&mode=login&redirect=${redirect}`, {
            replace: true,
        })
    }

    const skipGymStep = async () => {
        setGymSetupDone(true)
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const completeGymAtGym = async () => {
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const deferGymOnboarding = (_gymName: string) => {
        navigate('/home', { replace: true })
    }

    useEffect(() => {
        if (step !== 'account') return
        if (auth.status !== 'authenticated') return
        navigate('/onboarding?step=gym', { replace: true })
        // On réagit seulement au passage en step=account + auth.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, auth.status])

    useEffect(() => {
        if (step !== 'account') return
        if (auth.status === 'authenticated') return
        const mode = searchParams.get('mode')
        const currentRedirect = searchParams.get('redirect')
        if (mode === 'login' && currentRedirect === '/onboarding?step=account') {
            return
        }
        const redirect = encodeURIComponent('/onboarding?step=account')
        navigate(`/onboarding?step=account&mode=login&redirect=${redirect}`, {
            replace: true,
        })
    }, [step, auth.status, navigate, searchParams])

    return (
        <OnboardingVideoShell>
            {step === 'intro' ? (
                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
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
                            <Button variant="accent" className="w-full" onClick={() => goBody(0)}>
                                {UI.continue}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : step === 'body' ? (
                <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
                    <StepCard
                        key={`body-${bodyQ}`}
                        animated
                        className="shadow-2xl"
                        onBack={backBody}
                        backLabel={UI.back}
                        stepLabel={stepIndicator}
                        progressPercent={bodyProgressPercent}
                        title={bodyStepTitle}
                    >
                        {bodyQ === 0 && (
                            <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                <div>
                                    <p className="text-sm text-muted-foreground">
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
                                    <p className="text-sm text-muted-foreground">
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
                                    <p className="text-sm text-muted-foreground">
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
                    </StepCard>
                </main>
            ) : step === 'account' ? (
                <AuthPage embedded />
            ) : step === 'gym' ? (
                <OnboardingGymStep
                    onCompleteAtGym={() => void completeGymAtGym()}
                    onDeferred={deferGymOnboarding}
                    onSkip={() => void skipGymStep()}
                />
            ) : null}
        </OnboardingVideoShell>
    )
}

export default OnboardingPage
