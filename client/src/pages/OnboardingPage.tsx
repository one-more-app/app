import { AddPerfDrawer } from '@/components/AddPerfDrawer';
import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker';
import { OnboardingShell } from '@/components/OnboardingShell';
import { StepCard } from '@/components/StepCard';
import { Trackable } from '@/components/analytics/Trackable';
import { OnboardingExerciseList } from '@/components/onboarding/OnboardingExerciseList';
import { OnboardingGymPermissionsStep } from '@/components/onboarding/OnboardingGymPermissionsStep';
import { OnboardingGymStep } from '@/components/onboarding/OnboardingGymStep';
import { OnboardingGymWaitStep } from '@/components/onboarding/OnboardingGymWaitStep';
import { OnboardingIntro } from '@/components/onboarding/OnboardingIntro';
import { OnboardingNotificationsStep } from '@/components/onboarding/OnboardingNotificationsStep';
import { OnboardingRankReveal } from '@/components/onboarding/OnboardingRecordResults';
import { OnboardingReveal, OnboardingStepLayout, onboardingEntrance, onboardingStepCardClassName } from '@/components/onboarding/onboarding-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfileData } from '@/hooks/use-api-data';
import { useAuth } from '@/hooks/use-auth';
import { useMutateUserGym, useUserGymData } from '@/hooks/use-user-gym-data';
import {
    OnboardingSteps,
    bodyStepFromQuestion,
    trackOnboardingStepCompleted,
    trackOnboardingStepSkipped,
    useOnboardingStepViewed,
} from '@/lib/analytics';
import { unlockGymAccess } from '@/lib/gym-onboarding';
import { gymOnboardingPath, resolveGymOnboardingStep } from '@/lib/gym-onboarding-route';
import { fetchUserGym } from '@/lib/gyms-api';
import { hapticSelectionChanged, primeHaptics } from '@/lib/haptics';
import {
    isGymPermissionsNativeContext,
    isGymReselectOnboarding,
    isOnboardingGymDevPreview,
    isOnboardingGymFromSettings,
    seedOnboardingGymDevState,
} from '@/lib/onboarding-gym-dev';
import {
    defaultOnboardingPerf,
    findOnboardingStarterExercise,
    onboardingExerciseGifUrl,
    onboardingTrackedId,
    type OnboardingStarterExercise,
} from '@/lib/onboarding-starter-exercises';
import { continueAfterOnboardingNotifications, isOnboardingNotificationsPath, ONBOARDING_NOTIFICATIONS_STEP_ENABLED, postAuthNavigateOptions, resolvePostAuthNavigation } from '@/lib/post-auth-navigation';
import {
    beginOnboardingDraftSession,
    discardPendingOnboardingDrafts,
    getGymOnboardingContext,
    getOnboardingPostAuthRedirect,
    getUserProfile,
    hasOnboardingDraftSession,
    hasPersistedUserProfile,
    markOnboardingDone,
    peekPendingOnboardingRecord,
    setGymPermissionsPromptDone,
    setOnboardingFirstExercisePending,
    setOnboardingPostAuthRedirect,
    setPendingOnboardingProfile,
    setPendingOnboardingRecord,
    setUserProfile,
} from '@/lib/storage';
import { getLeagueInfo } from '@/lib/strength-standards';
import { UI } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { AuthPage } from '@/pages/AuthPage';
import {
    Mars,
    Venus
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

const BODY_TOTAL = 2
const ONBOARDING_TOTAL = 3

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
                            data-analytics-label={
                                id === 'male'
                                    ? 'onboarding_gender_male'
                                    : 'onboarding_gender_female'
                            }
                            onClick={() => {
                                if (!selected) void hapticSelectionChanged()
                                onChange(id)
                            }}
                            className={onboardingEntrance(
                                'w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                'animate-in fade-in-0 slide-in-from-left-3 duration-350',
                            )}
                            style={{
                                animationDelay: `${200 + index * 70}ms`,
                            }}
                        >
                            <Card
                                className={cn(
                                    'items-center px-3 py-4 transition-colors',
                                    selected
                                        ? 'bg-accent text-accent-foreground'
                                        : 'hover:bg-muted/40',
                                )}
                            >
                                <CardHeader className="flex flex-col items-center gap-2 p-0">
                                    <Icon
                                        className="size-9 stroke-[1.75]"
                                        aria-hidden
                                    />
                                    <CardTitle>{label}</CardTitle>
                                </CardHeader>
                            </Card>
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
                            : normalizedStep === 'notifications'
                                ? 'notifications'
                                : normalizedStep === 'rank'
                                    ? 'rank'
                                    : normalizedStep === 'intro' || !normalizedStep
                                        ? 'intro'
                                        : normalizedStep === '1rm'
                                            ? 'body'
                                            : 'record'
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
    const viewedStep =
        step === 'intro'
            ? OnboardingSteps.INTRO
            : step === 'record'
                ? OnboardingSteps.RECORD_PICK
                : step === 'rank'
                    ? OnboardingSteps.RANK_REVEAL
                    : step === 'body'
                        ? bodyStepFromQuestion(bodyQ)
                        : step === 'account'
                            ? OnboardingSteps.ACCOUNT_EMAIL
                            : step === 'gym'
                                ? OnboardingSteps.GYM_QUESTION
                                : step === 'gym-permissions'
                                    ? OnboardingSteps.GYM_PERMISSIONS
                                    : step === 'gym-wait'
                                        ? OnboardingSteps.GYM_WAIT
                                        : step === 'notifications'
                                            ? OnboardingSteps.NOTIFICATIONS
                                            : null
    useOnboardingStepViewed(
        step === 'gym' || step === 'account' ? null : viewedStep,
    )

    const goRecord = () => {
        navigate('/onboarding?step=record', { replace: true })
    }

    const goRank = () => {
        navigate('/onboarding?step=rank', { replace: true })
    }

    const goBody = (q = 0) => {
        navigate(`/onboarding?step=body&bodyQ=${q}`, { replace: true })
    }

    const [weightKg, setWeightKg] = useState(75)
    const [heightCm, setHeightCm] = useState(175)
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [unlockingGym, setUnlockingGym] = useState(false)
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
    const [perfDrawerOpen, setPerfDrawerOpen] = useState(false)
    const [perfWeight, setPerfWeight] = useState(60)
    const [perfReps, setPerfReps] = useState(5)

    const selectedExercise = selectedExerciseId
        ? findOnboardingStarterExercise(selectedExerciseId) ?? null
        : null

    const persistRecordDraft = (
        exercise: OnboardingStarterExercise,
        weight: number,
        reps: number,
    ) => {
        const existing = peekPendingOnboardingRecord()
        setPendingOnboardingRecord({
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            originalName: exercise.originalName,
            bodyPart: exercise.bodyPart,
            target: exercise.target,
            equipment: exercise.equipment,
            gifUrl: onboardingExerciseGifUrl(exercise.exerciseId),
            weight,
            reps,
            clientTrackedId: onboardingTrackedId(exercise.exerciseId),
            clientPerfId:
                existing?.exerciseId === exercise.exerciseId
                    ? existing.clientPerfId
                    : crypto.randomUUID(),
        })
    }

    useEffect(() => {
        if (step !== 'record') return
        if (!hasOnboardingDraftSession()) {
            beginOnboardingDraftSession()
            return
        }
        const draft = peekPendingOnboardingRecord()
        if (!draft) return
        setSelectedExerciseId(draft.exerciseId)
        setPerfWeight(draft.weight)
        setPerfReps(draft.reps)
    }, [step])

    useEffect(() => {
        if (step !== 'body') return
        const p = profile ?? (hasPersistedUserProfile() ? getUserProfile() : null)
        if (!p) return
        setGender(p.gender)
        setWeightKg(p.weightKg)
        setHeightCm(p.heightCm)
    }, [profile, step])

    useEffect(() => {
        if (step !== 'body' && step !== 'rank') return
        primeHaptics()
    }, [step])

    useEffect(() => {
        if (step !== 'rank') return
        if (selectedExercise) return
        goRecord()
        // goRecord est stable via navigate replace
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, selectedExercise])

    const canAdvanceWeight = weightKg >= 30 && weightKg <= 300
    const canAdvanceHeight = heightCm >= 100 && heightCm <= 250

    const finishBodyAndContinue = async () => {
        if (!canAdvanceWeight || !canAdvanceHeight) return
        const body = {
            weightKg,
            heightCm,
            gender,
        }
        if (auth.status === 'authenticated') {
            setUserProfile(body)
        } else {
            // Anonyme: le PUT échoue sans JWT, et applySession purge le cache.
            // On persiste le draft pour le rejouer après inscription / login.
            setPendingOnboardingProfile(body)
            setUserProfile(body, { silent: true })
        }
        void mutate('profile')
        trackOnboardingStepCompleted({
            step: OnboardingSteps.BODY_HEIGHT,
            gender,
            weight_kg: weightKg,
            height_cm: heightCm,
        })
        goRank()
    }

    const advanceBody = () => {
        if (bodyQ === 1) {
            trackOnboardingStepCompleted({
                step: OnboardingSteps.BODY_WEIGHT,
                weight_kg: weightKg,
            })
            void finishBodyAndContinue()
            return
        }
        trackOnboardingStepCompleted({
            step: OnboardingSteps.BODY_GENDER,
            gender,
        })
        goBody(bodyQ + 1)
    }

    const backBody = () => {
        if (bodyQ <= 0) {
            goRecord()
            return
        }
        goBody(bodyQ - 1)
    }

    const onboardingStepNumber =
        step === 'record'
            ? 1
            : step === 'body'
                ? 2
                : step === 'rank'
                    ? 3
                    : 2

    const stepIndicator = UI.onboardingStepIndicator
        .replace('{current}', String(onboardingStepNumber))
        .replace('{total}', String(ONBOARDING_TOTAL))
    const bodyProgressPercent =
        step === 'record'
            ? 33
            : step === 'body'
                ? 55 + bodyQ * 20
                : 100

    const bodyStepTitle =
        bodyQ === 0
            ? UI.onboardingBodyTitleGender
            : UI.onboardingBodyTitleBuild

    const leagueInfo = useMemo(() => {
        if (!selectedExercise) return null
        return getLeagueInfo({
            weight: perfWeight,
            reps: perfReps,
            bodyWeightKg: weightKg,
            gender,
            exerciseName: selectedExercise.originalName,
            exerciseMetadata: {
                equipment: selectedExercise.equipment,
                target: selectedExercise.target,
            },
        })
    }, [selectedExercise, perfWeight, perfReps, weightKg, gender])

    const openRecordDrawer = (exercise: OnboardingStarterExercise) => {
        setSelectedExerciseId(exercise.exerciseId)
        const draft = peekPendingOnboardingRecord()
        if (draft?.exerciseId === exercise.exerciseId) {
            setPerfWeight(draft.weight)
            setPerfReps(draft.reps)
        } else {
            const defaults = defaultOnboardingPerf(exercise)
            setPerfWeight(defaults.weight)
            setPerfReps(defaults.reps)
        }
        setPerfDrawerOpen(true)
        trackOnboardingStepCompleted({
            step: OnboardingSteps.RECORD_PICK,
            exercise_id: exercise.exerciseId,
        })
    }

    const saveRecordFromDrawer = (weight: number, reps: number) => {
        const exercise =
            selectedExercise ??
            (selectedExerciseId
                ? findOnboardingStarterExercise(selectedExerciseId) ?? null
                : null)
        if (!exercise || reps <= 0) return
        setPerfWeight(weight)
        setPerfReps(reps)
        persistRecordDraft(exercise, weight, reps)
        trackOnboardingStepCompleted({
            step: OnboardingSteps.RECORD_PERF,
            exercise_id: exercise.exerciseId,
            weight,
            reps,
        })
        goBody(0)
    }

    const beatRecord = () => {
        if (!selectedExercise) return
        persistRecordDraft(selectedExercise, perfWeight, perfReps)
        trackOnboardingStepCompleted({
            step: OnboardingSteps.RANK_REVEAL,
            exercise_id: selectedExercise.exerciseId,
            rank: leagueInfo?.rankId,
            percentile: leagueInfo?.percentileEstimate,
        })
        void finishOnboarding('/home')
    }

    const finishOnboarding = async (nextPath: string) => {
        if (auth.status === 'authenticated') {
            setOnboardingPostAuthRedirect(null)
            const resolvedPath = await resolvePostAuthNavigation(nextPath)
            if (!isOnboardingNotificationsPath(resolvedPath)) {
                markOnboardingDone(resolvedPath)
            }
            navigate(resolvedPath, postAuthNavigateOptions(resolvedPath))
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
        trackOnboardingStepCompleted({ step: OnboardingSteps.GYM_PERMISSIONS })
        setGymPermissionsPromptDone(true)
        await completeGymAfterPermissions()
    }

    const skipGymPermissions = async () => {
        trackOnboardingStepSkipped({
            step: OnboardingSteps.GYM_PERMISSIONS,
            reason: 'skipped',
        })
        setGymPermissionsPromptDone(true)
        await unlockGymAccess()
        setOnboardingFirstExercisePending(true)
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const skipGymStep = async () => {
        trackOnboardingStepSkipped({
            step: OnboardingSteps.GYM_SEARCH,
            reason: 'no_gym',
        })
        toast.message(UI.gymOnboardingSkipToast)
        setOnboardingFirstExercisePending(true)
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const continueAfterGymResolved = async () => {
        const nextPath = getOnboardingPostAuthRedirect() ?? '/home'
        await finishOnboarding(nextPath)
    }

    const completeNotificationsStep = (outcome: 'enabled' | 'skipped') => {
        if (outcome === 'enabled') {
            trackOnboardingStepCompleted({ step: OnboardingSteps.NOTIFICATIONS })
        } else {
            trackOnboardingStepSkipped({
                step: OnboardingSteps.NOTIFICATIONS,
                reason: 'skipped',
            })
        }
        const nextPath = continueAfterOnboardingNotifications()
        navigate(nextPath, postAuthNavigateOptions(nextPath))
    }

    const navigateToResolvedGymStep = (
        resolved: ReturnType<typeof resolveGymOnboardingStep>,
    ) => {
        if (!resolved) return false
        navigate(gymOnboardingPath(resolved), { replace: true })
        return true
    }

    const handleGymUnlock = async () => {
        trackOnboardingStepCompleted({ step: OnboardingSteps.GYM_WAIT })
        setUnlockingGym(true)
        try {
            await unlockGymAccess()
            const resolvedPath = await resolvePostAuthNavigation('/home')
            navigate(resolvedPath, postAuthNavigateOptions(resolvedPath))
        } finally {
            setUnlockingGym(false)
        }
    }

    useEffect(() => {
        if (rawStep === 'gym-notifications' || rawStep === 'gym-location') {
            navigate('/onboarding?step=gym-permissions', { replace: true })
        }
        if (rawStep === 'notifications' && !ONBOARDING_NOTIFICATIONS_STEP_ENABLED) {
            const nextPath = continueAfterOnboardingNotifications()
            navigate(nextPath, postAuthNavigateOptions(nextPath))
        }
        if (rawStep === '1rm') {
            navigate('/onboarding?step=body&bodyQ=0', { replace: true })
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
            step === 'account' ||
            step === 'notifications'
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
        <OnboardingShell variant={step === 'intro' ? 'cinematic' : 'theme'}>
            {step === 'intro' ? (
                <OnboardingIntro
                    onContinue={() => {
                        trackOnboardingStepCompleted({
                            step: OnboardingSteps.INTRO,
                        })
                        beginOnboardingDraftSession()
                        goRecord()
                    }}
                    onHasAccount={() => {
                        trackOnboardingStepSkipped({
                            step: OnboardingSteps.INTRO,
                            reason: 'has_account',
                        })
                        discardPendingOnboardingDrafts()
                        void finishOnboarding('/home')
                    }}
                />
            ) : step === 'record' ? (
                <Trackable section="onboarding" feature={OnboardingSteps.RECORD_PICK}>
                    <OnboardingStepLayout>
                        <StepCard
                            className={onboardingStepCardClassName}
                            stepLabel={stepIndicator}
                            progressPercent={bodyProgressPercent}
                            title={UI.onboardingRecordTitle}
                        >
                            <OnboardingReveal delayMs={80}>
                                <p className="text-sm text-muted-foreground">
                                    {UI.onboardingRecordHint}
                                </p>
                            </OnboardingReveal>
                            <OnboardingExerciseList onSelect={openRecordDrawer} />
                            <OnboardingReveal delayMs={200}>
                                <p className="text-xs text-muted-foreground">
                                    {UI.onboardingRecordMicro}
                                </p>
                            </OnboardingReveal>
                        </StepCard>
                    </OnboardingStepLayout>
                    {selectedExercise ? (
                        <AddPerfDrawer
                            open={perfDrawerOpen}
                            onOpenChange={setPerfDrawerOpen}
                            title={UI.onboardingPerfTitle}
                            exercise={{
                                id: onboardingTrackedId(selectedExercise.exerciseId),
                                name: selectedExercise.name,
                                originalName: selectedExercise.originalName,
                                equipment: selectedExercise.equipment,
                                target: selectedExercise.target,
                            }}
                            initialWeight={perfWeight}
                            initialReps={perfReps}
                            onSave={saveRecordFromDrawer}
                        />
                    ) : null}
                </Trackable>
            ) : step === 'rank' ? (
                <Trackable section="onboarding" feature={OnboardingSteps.RANK_REVEAL}>
                    <OnboardingStepLayout>
                        <StepCard
                            className={onboardingStepCardClassName}
                            onBack={() => goBody(BODY_TOTAL - 1)}
                            backLabel={UI.back}
                            backAnalyticsLabel="onboarding_rank_back"
                            stepLabel={stepIndicator}
                            progressPercent={bodyProgressPercent}
                            title={UI.  onboardingRankTitle}
                        >
                            {leagueInfo && selectedExercise ? (
                                <OnboardingRankReveal
                                    league={leagueInfo}
                                    exercise={selectedExercise}
                                    weight={perfWeight}
                                    reps={perfReps}
                                />
                            ) : null}
                            <OnboardingReveal delayMs={240} className="mt-auto space-y-2">
                                {auth.status === 'authenticated' ? null : (
                                    <p className="text-center text-xs text-muted-foreground">
                                        {UI.onboardingAccountLossHint}
                                    </p>
                                )}
                                <Button
                                    onClick={beatRecord}
                                    className="w-full"
                                    data-analytics-label={
                                        auth.status === 'authenticated'
                                            ? 'onboarding_beat_record'
                                            : 'onboarding_save_account'
                                    }
                                >
                                    {auth.status === 'authenticated'
                                        ? UI.onboardingBeatRecord
                                        : UI.onboardingSaveAccountCta}
                                </Button>
                            </OnboardingReveal>
                        </StepCard>
                    </OnboardingStepLayout>
                </Trackable>
            ) : step === 'body' ? (
                <Trackable
                    section="onboarding"
                    feature={bodyStepFromQuestion(bodyQ)}
                >
                    <OnboardingStepLayout>
                        <StepCard
                            key={`body-${bodyQ}`}
                            className={onboardingStepCardClassName}
                            onBack={backBody}
                            backLabel={UI.back}
                            backAnalyticsLabel="onboarding_body_back"
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
                                    <OnboardingReveal delayMs={220}>
                                        <p className="text-xs text-muted-foreground">
                                            {UI.onboardingQuestionGenderMicro}
                                        </p>
                                    </OnboardingReveal>
                                </div>
                            )}

                            {bodyQ === 1 && (
                                <div className="space-y-4">
                                    <OnboardingReveal delayMs={80}>
                                        <p className="text-sm text-muted-foreground">
                                            {UI.onboardingQuestionBuildHint}
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
                                    <OnboardingReveal delayMs={200}>
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
                                    <OnboardingReveal delayMs={240}>
                                        <p className="text-xs text-muted-foreground">
                                            {UI.onboardingQuestionBuildMicro}
                                        </p>
                                    </OnboardingReveal>
                                </div>
                            )}

                            <OnboardingReveal delayMs={280} className="mt-auto">
                                <Button
                                    onClick={advanceBody}
                                    className="w-full"
                                    data-analytics-label={
                                        bodyQ === BODY_TOTAL - 1
                                            ? 'onboarding_body_continue'
                                            : 'onboarding_body_next'
                                    }
                                    disabled={
                                        bodyQ === 1 &&
                                        (!canAdvanceWeight || !canAdvanceHeight)
                                    }
                                >
                                    {bodyQ === BODY_TOTAL - 1
                                        ? UI.onboardingSeeRankCta
                                        : UI.continue}
                                </Button>
                            </OnboardingReveal>
                        </StepCard>
                    </OnboardingStepLayout>
                </Trackable>
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
                    onSkip={fromSettings ? undefined : () => void skipGymStep()}
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
            ) : step === 'notifications' && ONBOARDING_NOTIFICATIONS_STEP_ENABLED ? (
                <OnboardingNotificationsStep
                    onContinue={() => completeNotificationsStep('enabled')}
                    onSkip={() => completeNotificationsStep('skipped')}
                />
            ) : null}
        </OnboardingShell>
    )
}

export default OnboardingPage
