import { BackHeader } from '@/components/BackHeader'
import { CustomExerciseMetadataFields } from '@/components/CustomExerciseMetadataFields'
import { ExerciseCatalogBrowse } from '@/components/ExerciseCatalogBrowse'
import { ExerciseImage } from '@/components/ExerciseImage'
import { useReferralDrawer } from '@/hooks/use-referral-drawer'
import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { ExerciseCatalogSkeletonList } from '@/components/skeletons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccess } from '@/hooks/use-access'
import { SWR_KEYS } from '@/hooks/use-api-data'
import { useBack } from '@/hooks/use-back'
import { useExerciseCatalogBrowse } from '@/hooks/use-exercise-catalog-browse'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { useTheme } from '@/hooks/use-theme'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { fetchExercisesCatalog, fetchExercisesMeta } from '@/lib/data-api'
import { filterCatalogExercises } from '@/lib/exercise-catalog-browse'
import { inferBodyPartFromTarget } from '@/lib/infer-body-part-from-target'
import { getJoyrideScrollOffset, getJoyrideShiftPadding } from '@/lib/joyride-config'
import {
    addTrackedExerciseAndWait,
    isOnboardingFirstExercisePending,
    isOnboardingTourComplete,
    savePerformanceAndWait,
    setOnboardingFirstExercisePending,
} from '@/lib/storage'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import { translateBodyPart, translateTarget, UI } from '@/lib/translations'
import { notifyXpGrants } from '@/lib/xp-notifications'
import type { ExerciseDBExercise } from '@/types'
import { Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EVENTS, Joyride, type EventData, type Step } from 'react-joyride'
import { useNavigate } from 'react-router-dom'
import useSWR, { useSWRConfig } from 'swr'

export function ExerciseListPage() {
    const navigate = useNavigate()
    const { resolvedTheme } = useTheme()
    const { mutate } = useSWRConfig()
    const [firstExerciseTourDismissed, setFirstExerciseTourDismissed] = useState(false)
    const { exercises: tracked, addExercise } = useTrackedExercises()
    const [targets, setTargets] = useState<string[]>([])
    const [equipmentOptions, setEquipmentOptions] = useState<string[]>([])
    const { searchInput, searchQuery, handleSearchChange } = useExerciseFilters({
        includePage: false,
    })

    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customTarget, setCustomTarget] = useState('chest' as string)
    const [customEquipment, setCustomEquipment] = useState('body weight')
    const [addWithPerfExercise, setAddWithPerfExercise] = useState<ExerciseDBExercise | null>(null)
    const [selectedExercise, setSelectedExercise] = useState<ExerciseDBExercise | null>(null)
    const [perfWeight, setPerfWeight] = useState(0)
    const [perfReps, setPerfReps] = useState(1)
    const { openReferralDrawer } = useReferralDrawer()
    const { canAddExercise } = useAccess()

    const guardAddExercise = useCallback(
        (action: () => void) => {
            if (!canAddExercise) {
                openReferralDrawer('limit')
                return
            }
            action()
        },
        [canAddExercise, openReferralDrawer],
    )
    const firstExerciseTourActive =
        isOnboardingFirstExercisePending() &&
        !isOnboardingTourComplete() &&
        !firstExerciseTourDismissed

    const stopFirstExerciseTour = useCallback(() => {
        setFirstExerciseTourDismissed(true)
    }, [])

    const handleFirstExerciseJoyrideEvent = useCallback(
        (data: EventData) => {
            if (data.type === EVENTS.TOUR_END) {
                stopFirstExerciseTour()
            }
        },
        [stopFirstExerciseTour],
    )

    useEffect(() => {
        if (!firstExerciseTourActive) return
        const viewport = document.querySelector('.app-scroll-viewport')
        if (viewport instanceof HTMLElement) {
            viewport.scrollTop = 0
        }
    }, [firstExerciseTourActive])

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )

    const { data: catalogData, error: catalogError, isLoading: isLoadingCatalog } = useSWR(
        'exercise-catalog-full',
        async () =>
            await fetchExercisesCatalog({
                limit: 10000,
                offset: 0,
            }),
    )

    const { data: metaData } = useSWR('exercise-meta', fetchExercisesMeta)

    useEffect(() => {
        if (!metaData) return
        setTargets(metaData.targets.filter((t) => t !== 'cardio'))
        setEquipmentOptions(metaData.equipment)
    }, [metaData])

    const {
        browse,
        viewAll,
        pickZone,
        pickTarget,
        pickEquipment,
        goToStep,
        goBackInBrowse,
        toggleViewAll,
    } = useExerciseCatalogBrowse({ replaceOnNavigate: true })
    const navigateBack = useBack()

    const catalogExercises = useMemo(() => {
        return filterCatalogExercises(catalogData?.items ?? [])
    }, [catalogData?.items])

    const isSearchMode = searchQuery.trim().length > 0
    const prevSearchQueryRef = useRef(searchQuery)

    useEffect(() => {
        const prev = prevSearchQueryRef.current.trim()
        const next = searchQuery.trim()
        if (prev && !next) {
            goToStep('zone', { replace: true })
        }
        prevSearchQueryRef.current = searchQuery
    }, [searchQuery, goToStep])

    useEffect(() => {
        if (isSearchMode) return
        if (browse.step === 'list' && (!browse.zone || !browse.target || !browse.beq)) {
            goToStep('zone', { replace: true })
        } else if (
            browse.step === 'equipment' &&
            (!browse.zone || !browse.target)
        ) {
            goToStep(browse.zone ? 'muscle' : 'zone', { replace: true })
        } else if (browse.step === 'muscle' && !browse.zone) {
            goToStep('zone', { replace: true })
        }
    }, [browse.step, browse.zone, browse.target, browse.beq, goToStep, isSearchMode])

    useEffect(() => {
        if (targets.length > 0 && !targets.includes(customTarget)) {
            setCustomTarget(targets[0]!)
        }
    }, [targets, customTarget])

    useEffect(() => {
        if (equipmentOptions.length > 0 && !equipmentOptions.includes(customEquipment)) {
            const preferred = equipmentOptions.includes('body weight')
                ? 'body weight'
                : equipmentOptions[0]!
            setCustomEquipment(preferred)
        }
    }, [equipmentOptions, customEquipment])

    const handleHeaderBack = useCallback(() => {
        if (isSearchMode) {
            handleSearchChange('')
            return
        }
        if (goBackInBrowse()) return
        // Après onboarding, l'arrivée sur /exercises remplace l'historique : navigate(-1) ne fait rien.
        if (isOnboardingFirstExercisePending()) {
            setOnboardingFirstExercisePending(false)
            stopFirstExerciseTour()
            navigate('/home', { replace: true })
            return
        }
        navigateBack()
    }, [
        isSearchMode,
        handleSearchChange,
        goBackInBrowse,
        navigateBack,
        navigate,
        stopFirstExerciseTour,
    ])

    const firstExerciseOnboardingSteps = useMemo<Step[]>(() => {
        const scrollOffset = getJoyrideScrollOffset()
        const steps: Step[] = [
            {
                target: '[data-tour="first-exercise-browse-anchor"]',
                title: UI.onboardingFirstExerciseTitle,
                content: UI.onboardingFirstExerciseDescription,
                placement: 'bottom',
                skipScroll: true,
                floatingOptions: {
                    shiftOptions: { padding: getJoyrideShiftPadding() },
                },
            },
        ]
        if (!isSearchMode && browse.step === 'list' && catalogExercises.length > 0) {
            steps.push({
                target: '[data-tour="first-exercise-add"]',
                title: UI.onboardingFirstExerciseTourAddTitle,
                content: UI.onboardingFirstExerciseTourAddContent,
                placement: 'left',
                scrollOffset,
            })
        }
        return steps
    }, [isSearchMode, browse.step, catalogExercises.length, firstExerciseTourActive])

    const firstExerciseJoyrideOptions = useMemo(
        () => ({
            arrowColor: 'var(--card)',
            backgroundColor: 'var(--card)',
            textColor: 'var(--card-foreground)',
            primaryColor: 'var(--accent)',
            overlayColor:
                resolvedTheme === 'dark'
                    ? 'oklch(0.04 0 0 / 0.82)'
                    : 'oklch(0.2 0 0 / 0.5)',
            spotlightPadding: 10,
            spotlightRadius: 14,
            zIndex: 120,
            showProgress: true,
            skipBeacon: true,
            scrollOffset: getJoyrideScrollOffset(),
            buttons: ['back', 'close', 'primary', 'skip'] as const,
        }),
        [resolvedTheme, firstExerciseTourActive],
    )

    const firstExerciseJoyrideStyles = useMemo(
        () => ({
            tooltip: {
                backgroundColor: 'var(--card)',
                color: 'var(--card-foreground)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                boxShadow:
                    resolvedTheme === 'dark'
                        ? '0 16px 48px oklch(0 0 0 / 0.55), 0 0 0 1px oklch(1 0 0 / 0.06)'
                        : '0 16px 40px oklch(0 0 0 / 0.14), 0 0 0 1px oklch(0 0 0 / 0.05)',
                fontFamily: 'var(--font-sans)',
                padding: '1rem 1rem 0.75rem',
            },
            tooltipContainer: {
                textAlign: 'left' as const,
            },
            tooltipTitle: {
                fontFamily: 'var(--font-one-more)',
                fontStyle: 'italic',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.04em',
                fontSize: '0.9375rem',
                color: 'var(--card-foreground)',
                marginBottom: '0.35rem',
            },
            tooltipContent: {
                color: 'var(--muted-foreground)',
                fontSize: '0.875rem',
                lineHeight: 1.55,
                padding: '0.25rem 0 0',
            },
            tooltipFooter: {
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                gap: '0.5rem',
            },
            buttonPrimary: {
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-foreground)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-one-more)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                padding: '0.5rem 1rem',
                outline: 'none',
            },
            buttonBack: {
                color: 'var(--muted-foreground)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                padding: '0.5rem 0.75rem',
                marginRight: 'auto',
            },
            buttonSkip: {
                color: 'var(--muted-foreground)',
                fontSize: '0.8125rem',
                padding: '0.5rem 0.5rem',
            },
            buttonClose: {
                color: 'var(--muted-foreground)',
                height: '0.75rem',
                width: '0.75rem',
                padding: '0.375rem',
                borderRadius: 'var(--radius-md)',
            },
        }),
        [resolvedTheme],
    )

    const openAddWithPerf = (ex: ExerciseDBExercise) => {
        if (trackedIds.has(`api-${ex.id}`)) return
        guardAddExercise(() => {
            setAddWithPerfExercise(ex)
            setPerfWeight(0)
            setPerfReps(1)
        })
    }

    const handleAddWithPerfSubmit = async () => {
        if (!addWithPerfExercise || perfReps <= 0) return
        const ex = addWithPerfExercise
        const trackedId = `api-${ex.id}`
        try {
            await addTrackedExerciseAndWait({
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
            const { xp } = await savePerformanceAndWait(
                trackedId,
                perfWeight,
                perfReps,
            )
            notifyXpGrants(xp)
            await Promise.all([
                mutate(SWR_KEYS.trackedExercises),
                mutate(SWR_KEYS.performanceEntries),
                mutate(SWR_KEYS.performanceEntriesWithInsights),
                mutate(SWR_KEYS.homeExercises),
                mutate(SWR_KEYS.progress),
            ])
            setAddWithPerfExercise(null)
            const shouldLaunchExerciseTour = isOnboardingFirstExercisePending()
            navigate(
                shouldLaunchExerciseTour
                    ? `/exercise/${trackedId}`
                    : `/exercise/${trackedId}`,
                { replace: true, state: { fromAddExercise: true } },
            )
        } catch {
            // Si la création remote échoue, on garde le drawer ouvert et on affiche l'erreur.
            // L'utilisateur peut corriger/retry sans perdre ses valeurs.
        }
    }

    function getWeightLabel(ex: ExerciseDBExercise): string {
        const name = ex.name
        const meta = ex.equipment && ex.target
            ? { equipment: ex.equipment, target: ex.target }
            : undefined
        if (isBodyweightAdditiveExercise(name, meta)) return UI.addedWeight
        if (isDumbbellExercise(name, meta)) return UI.weightPerDumbbell
        return UI.weight
    }

    const handleAddCustom = () => {
        if (!customName.trim() || !customTarget || !customEquipment) return
        guardAddExercise(() => {
            const id = `custom-${crypto.randomUUID()}`
            const bodyPart = inferBodyPartFromTarget(customTarget)
            void (async () => {
                await addExercise({
                    exerciseId: id,
                    name: customName.trim(),
                    originalName: customName.trim(),
                    bodyPart,
                    target: customTarget,
                    equipment: customEquipment,
                    isCustom: true,
                })
                setCustomName('')
                setCustomOpen(false)
            })()
        })
    }

    const customExerciseDialog = (
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Plus className="mr-2 size-4" />
                    {UI.custom}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{UI.newCustomExercise}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name">{UI.name}</Label>
                        <Input
                            id="name"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={UI.placeholderExerciseName}
                        />
                    </div>
                    {targets.length > 0 && equipmentOptions.length > 0 ? (
                        <CustomExerciseMetadataFields
                            targets={targets}
                            equipmentOptions={equipmentOptions}
                            target={customTarget}
                            equipment={customEquipment}
                            onTargetChange={setCustomTarget}
                            onEquipmentChange={setCustomEquipment}
                        />
                    ) : null}
                    <Button
                        onClick={handleAddCustom}
                        disabled={
                            !customName.trim() ||
                            !customTarget ||
                            !customEquipment ||
                            targets.length === 0 ||
                            equipmentOptions.length === 0
                        }
                        className="w-full"
                    >
                        {UI.add}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader compact title={UI.chooseExercises} onBack={handleHeaderBack} />

            <main className="mx-auto max-w-2xl px-4 py-4">
                {!catalogError ? (
                    <div
                        className="mb-4 flex flex-col gap-3"
                        data-tour="first-exercise-search"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={UI.searchExercise}
                                value={searchInput}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="bg-card pl-9"
                            />
                        </div>
                        {customExerciseDialog}
                    </div>
                ) : null}
                {catalogError ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                        <p className="text-destructive">{UI.apiErrorCustom}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {UI.apiErrorCustom}
                        </p>
                    </div>
                ) : isLoadingCatalog && !catalogData ? (
                    <ExerciseCatalogSkeletonList count={8} />
                ) : (
                    <ExerciseCatalogBrowse
                        exercises={catalogExercises}
                        browse={browse}
                        searchQuery={searchQuery}
                        trackedIds={trackedIds}
                        viewAll={viewAll}
                        onToggleViewAll={toggleViewAll}
                        onPickZone={pickZone}
                        onPickTarget={pickTarget}
                        onPickEquipment={pickEquipment}
                        onGoToStep={goToStep}
                        onSelectExercise={setSelectedExercise}
                        onAddExercise={openAddWithPerf}
                    />
                )}

                <Drawer open={!!addWithPerfExercise} onOpenChange={(open) => !open && setAddWithPerfExercise(null)}>
                    <DrawerContent>
                        <div className="w-full p-4">
                            <DrawerHeader>
                                <DrawerTitle>{UI.addAndRecordPerf}</DrawerTitle>
                            </DrawerHeader>
                            {addWithPerfExercise && (
                                <form
                                    className="space-y-6 pt-4"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleAddWithPerfSubmit()
                                    }}
                                >
                                    <div className="flex flex-col items-center gap-6 w-full">
                                        <HorizontalWheelPicker
                                            className="w-full"
                                            value={perfWeight}
                                            onChange={setPerfWeight}
                                            min={0}
                                            max={500}
                                            step={0.5}
                                            label={getWeightLabel(addWithPerfExercise)}
                                            unit="kg"
                                        />
                                        <HorizontalWheelPicker
                                            className="w-full"
                                            value={perfReps}
                                            onChange={setPerfReps}
                                            min={1}
                                            max={100}
                                            step={1}
                                            label={UI.reps}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={perfReps <= 0}
                                    >
                                        {UI.save}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </DrawerContent>
                </Drawer>

                <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
                    <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
                        {selectedExercise && (
                            <>
                                <div className="bg-muted">
                                    <ExerciseImage
                                        gifUrl={selectedExercise.gifUrl}
                                        bodyPart={selectedExercise.bodyPart}
                                        target={selectedExercise.target}
                                        className="mx-auto max-h-[min(44vh,340px)] w-full"
                                        imgClassName="mx-auto max-h-[min(44vh,340px)] w-full object-contain"
                                        fallbackIconClassName="size-20 text-muted-foreground"
                                        fit="contain"
                                    />
                                </div>
                                <div className="space-y-3 p-4 pt-4">
                                    <DialogHeader className="space-y-0 p-0 text-left">
                                        <DialogTitle className="truncate pr-8 text-left text-xl capitalize leading-snug">
                                            {selectedExercise.name}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge variant="secondary">
                                            {translateBodyPart(selectedExercise.bodyPart)}
                                        </Badge>
                                        <Badge variant="secondary">
                                            {translateTarget(selectedExercise.target)}
                                        </Badge>
                                        {selectedExercise.secondaryMuscles?.map((m) => (
                                            <Badge key={m} variant="outline">
                                                {translateTarget(m)}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button
                                        className="w-full"
                                        disabled={trackedIds.has(`api-${selectedExercise.id}`)}
                                        onClick={() => {
                                            openAddWithPerf(selectedExercise)
                                            setSelectedExercise(null)
                                        }}
                                    >
                                        {trackedIds.has(`api-${selectedExercise.id}`)
                                            ? UI.added
                                            : UI.add}
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {firstExerciseTourActive ? (
                    <Joyride
                        key="first-exercise-tour"
                        steps={firstExerciseOnboardingSteps}
                        run
                        continuous
                        options={firstExerciseJoyrideOptions}
                        styles={firstExerciseJoyrideStyles}
                        locale={{
                            back: UI.back,
                            close: UI.joyrideClose,
                            last: UI.joyrideLast,
                            next: UI.next,
                            skip: UI.joyrideSkip,
                            nextWithProgress: UI.joyrideNextWithProgress,
                        }}
                        onEvent={handleFirstExerciseJoyrideEvent}
                    />
                ) : null}
            </main>
        </div>
    )
}
