import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker';
import { OnboardingGymPermissionsStep } from '@/components/onboarding/OnboardingGymPermissionsStep'
import { OnboardingGymStep } from '@/components/onboarding/OnboardingGymStep';
import { OnboardingGymWaitStep } from '@/components/onboarding/OnboardingGymWaitStep';
import { OnboardingIntro } from '@/components/onboarding/OnboardingIntro';
import { onboardingEntrance, onboardingStepCardClassName, OnboardingReveal, OnboardingStepLayout } from '@/components/onboarding/onboarding-motion';
import { OnboardingShell } from '@/components/OnboardingShell';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useUserProfileData } from '@/hooks/use-api-data';
import { useAuth } from '@/hooks/use-auth';
import { useMutateUserGym, useUserGymData } from '@/hooks/use-user-gym-data';
import { unlockGymAccess } from '@/lib/gym-onboarding';
import { resolveGymOnboardingStep, gymOnboardingPath } from '@/lib/gym-onboarding-route';
import { fetchUserGym } from '@/lib/gyms-api';
import {
    isOnboardingGymDevPreview,
    isGymPermissionsNativeContext,
    isOnboardingGymFromSettings,
    isGymReselectOnboarding,
    seedOnboardingGymDevState,
} from '@/lib/onboarding-gym-dev';
import { resolvePostAuthNavigation } from '@/lib/post-auth-navigation';
import {
    getGymOnboardingContext,
    getOnboardingPostAuthRedirect,
    getUserProfile,
    hasPersistedUserProfile,
    markOnboardingDone,
    setGymPermissionsPromptDone,
    setOnboardingFirstExercisePending,
    setOnboardingPostAuthRedirect,
    setUserProfile
} from '@/lib/storage';
import { UI } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
    Mars,
    Venus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { AuthPage } from '@/pages/AuthPage';

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
        <OnboardingReveal delayMs={160}>
            <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label={UI.gender}
            >
                {choices.map(({ id, label, Icon }, index) => {
                    const selected = value === id
                    return (
                        <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(id)}
                            className={cn(
                                'flex w-full flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ease-out',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                onboardingEntrance(
                                    'animate-in fade-in-0 slide-in-from-left-3 duration-350',
                                ),
                                selected
                                    ? 'border-accent bg-accent/15 shadow-md ring-2 ring-accent/40'
                                    : 'border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-border',
                            )}
                            style={{
                                animationDelay: `${200 + index * 70}ms`,
                            }}
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
        </OnboardingReveal>
    )
}

function OnboardingPage() {
    const navigate = useNavigate()
    const { mutate } = useSWRConfig()
    const auth = useAuth()
    const { data: userGym, isLoading: userGymLoading } = useUserGymData()
    const mutateUserGym = useMutateUserGym()
    const { data: profile } = useUserProfileData()
    const [searchParams] = useSearchParams()
    const rawStep = searchParams.get('step')
    const normalizedStep =
        rawStep === 'gym-notifications' || rawStep === 'gym-location'
            ? 'gym-permissions'
            : rawStep
    const step =
        normalizedStep === 'body'
            ? 'body'
            : normalizedStep === 'account'
                ? 'account'
                : normalizedStep === 'gym'
                    ? 'gym'
                    : normalizedStep === 'gym-permissions'
                        ? 'gym-permissions'
                        : normalizedStep === 'gym-wait'
                            ? 'gym-wait'
                            : 'intro'
    const bodyQRaw = searchParams.get('bodyQ')
    const fromSettings = isOnboardingGymFromSettings(
        normalizedStep,
        searchParams.get('from'),
    )
    const gymReselect = isGymReselectOnboarding(
        normalizedStep,
        searchParams.get('reselect'),
    )
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
    const [unlockingGym, setUnlockingGym] = useState(false)

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

    const handleGymSaved = async () => {
        await mutateUserGym()
        if (fromSettings) {
            navigate('/settings', { replace: true })
            return
        }
        navigate('/onboarding?step=gym-permissions', { replace: true })
    }

    const goChangeGym = () => {
        navigate('/onboarding?step=gym&reselect=1', { replace: true })
    }

    const completeGymAfterPermissions = async () => {
        let gym: Awaited<ReturnType<typeof fetchUserGym>> | null = null
        try {
            gym = await fetchUserGym()
        } catch {
            gym = userGym ?? null
        }
        if (!gym) {
            navigate('/onboarding?step=gym', { replace: true })
            return
        }

        if (gym.onboardingGymPending) {
            navigate('/onboarding?step=gym-wait', { replace: true })
            return
        }

        setOnboardingFirstExercisePending(true)
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const completeGymPermissions = async () => {
        setGymPermissionsPromptDone(true)
        await completeGymAfterPermissions()
    }

    const skipGymPermissions = async () => {
        setGymPermissionsPromptDone(true)
        await unlockGymAccess()
        setOnboardingFirstExercisePending(true)
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const continueAfterGymResolved = async () => {
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const navigateToResolvedGymStep = (
        resolved: ReturnType<typeof resolveGymOnboardingStep>,
    ) => {
        if (!resolved) return false
        navigate(gymOnboardingPath(resolved), { replace: true })
        return true
    }

    const handleGymUnlock = async () => {
        setUnlockingGym(true)
        try {
            await unlockGymAccess()
            const resolvedPath = await resolvePostAuthNavigation('/home')
            navigate(resolvedPath, { replace: true })
        } finally {
            setUnlockingGym(false)
        }
    }

    useEffect(() => {
        if (rawStep === 'gym-notifications' || rawStep === 'gym-location') {
            navigate('/onboarding?step=gym-permissions', { replace: true })
        }
    }, [navigate, rawStep])

    useEffect(() => {
        if (step !== 'gym-permissions' && step !== 'gym-wait') return
        if (isOnboardingGymDevPreview(step)) {
            seedOnboardingGymDevState(step)
            return
        }
        if (userGymLoading) return
        if (step === 'gym-wait') return
        if (!userGym) {
            navigate('/onboarding?step=gym', { replace: true })
        }
    }, [navigate, step, userGym, userGymLoading])

    useEffect(() => {
        if (isOnboardingGymDevPreview(step)) return
        if ((fromSettings || gymReselect) && step === 'gym') return
        if (auth.status !== 'authenticated') return
        if (userGymLoading) return
        if (
            step === 'gym-permissions' ||
            step === 'gym-wait' ||
            step === 'account'
        ) {
            return
        }
        const resolved = resolveGymOnboardingStep(userGym ?? null, {
            permissionsNative: isGymPermissionsNativeContext(step),
        })
        if (resolved === 'gym-wait') {
            navigate('/onboarding?step=gym-wait', { replace: true })
            return
        }
        if (resolved === 'gym-permissions') {
            navigate('/onboarding?step=gym-permissions', { replace: true })
            return
        }
        if (resolved === null && step === 'gym' && !fromSettings) {
            void continueAfterGymResolved()
        }
        // Redir auto quand la salle est déjà résolue ; évite re-trigger sur continueAfterGymResolved.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.status, navigate, step, fromSettings, gymReselect, userGym, userGymLoading])

    useEffect(() => {
        if (step !== 'account') return
        if (auth.status !== 'authenticated') return
        if (userGymLoading) return

        const resolved = resolveGymOnboardingStep(userGym ?? null, {
            permissionsNative: isGymPermissionsNativeContext('gym'),
        })
        if (navigateToResolvedGymStep(resolved)) return
        void continueAfterGymResolved()
        // On réagit au passage en step=account + auth + chargement salle API.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, auth.status, userGym, userGymLoading])

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
        <OnboardingShell>
            {step === 'intro' ? (
                <OnboardingIntro
                    onContinue={() => goBody(0)}
                    errorMessage={auth.lastError}
                />
            ) : step === 'body' ? (
                <OnboardingStepLayout>
                    <StepCard
                        key={`body-${bodyQ}`}
                        className={onboardingStepCardClassName}
                        onBack={backBody}
                        backLabel={UI.back}
                        stepLabel={stepIndicator}
                        progressPercent={bodyProgressPercent}
                        title={bodyStepTitle}
                    >
                        {bodyQ === 0 && (
                            <div className="space-y-3">
                                <OnboardingReveal delayMs={80}>
                                    <p className="text-sm text-muted-foreground">
                                        {UI.onboardingQuestionGenderHint}
                                    </p>
                                </OnboardingReveal>
                                <OnboardingGenderRadios
                                    value={gender}
                                    onChange={setGender}
                                />
                            </div>
                        )}

                        {bodyQ === 1 && (
                            <div className="space-y-3">
                                <OnboardingReveal delayMs={80}>
                                    <p className="text-sm text-muted-foreground">
                                        {UI.onboardingQuestionWeightHint}
                                    </p>
                                </OnboardingReveal>
                                <OnboardingReveal delayMs={160}>
                                    <HorizontalWheelPicker
                                        label={UI.bodyWeight}
                                        unit=""
                                        min={30}
                                        max={300}
                                        step={0.5}
                                        value={weightKg}
                                        onChange={setWeightKg}
                                    />
                                </OnboardingReveal>
                            </div>
                        )}

                        {bodyQ === 2 && (
                            <div className="space-y-3">
                                <OnboardingReveal delayMs={80}>
                                    <p className="text-sm text-muted-foreground">
                                        {UI.onboardingQuestionHeightHint}
                                    </p>
                                </OnboardingReveal>
                                <OnboardingReveal delayMs={160}>
                                    <HorizontalWheelPicker
                                        label={UI.height}
                                        unit=""
                                        min={100}
                                        max={250}
                                        step={1}
                                        value={heightCm}
                                        onChange={setHeightCm}
                                    />
                                </OnboardingReveal>
                            </div>
                        )}

                        <OnboardingReveal delayMs={240}>
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
                        </OnboardingReveal>
                    </StepCard>
                </OnboardingStepLayout>
            ) : step === 'account' ? (
                <AuthPage embedded />
            ) : step === 'gym' ? (
                <OnboardingGymStep
                    fromSettings={fromSettings}
                    startAtSearch={gymReselect}
                    onSearchBack={
                        gymReselect
                            ? () => navigate('/onboarding?step=gym-permissions', { replace: true })
                            : undefined
                    }
                    onCancel={
                        fromSettings
                            ? () => navigate('/settings', { replace: true })
                            : undefined
                    }
                    onGymSaved={() => void handleGymSaved()}
                />
            ) : step === 'gym-permissions' ? (
                <OnboardingGymPermissionsStep
                    gymName={
                        isOnboardingGymDevPreview(step)
                            ? (getGymOnboardingContext()?.gymName ?? '')
                            : (userGym?.name ?? '')
                    }
                    gymAddress={
                        isOnboardingGymDevPreview(step) ? null : (userGym?.address ?? null)
                    }
                    onContinue={() => void completeGymPermissions()}
                    onSkip={() => void skipGymPermissions()}
                    onChangeGym={goChangeGym}
                />
            ) : step === 'gym-wait' ? (
                <OnboardingGymWaitStep
                    initialGymName={
                        isOnboardingGymDevPreview(step)
                            ? (getGymOnboardingContext()?.gymName ?? '')
                            : (userGym?.name ?? '')
                    }
                    initialGymAddress={
                        isOnboardingGymDevPreview(step) ? null : (userGym?.address ?? null)
                    }
                    onUnlock={() => void handleGymUnlock()}
                    onChangeGym={goChangeGym}
                    unlocking={unlockingGym}
                />
            ) : null}
        </OnboardingShell>
    )
}

export default OnboardingPage
