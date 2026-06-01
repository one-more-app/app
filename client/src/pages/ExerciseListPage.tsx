import { BackHeader } from '@/components/BackHeader'
import { ExerciseCatalogSkeletonList } from '@/components/skeletons'
import { ExerciseCatalogBrowse } from '@/components/ExerciseCatalogBrowse'
import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { SWR_KEYS } from '@/hooks/use-api-data'
import { fetchExercisesCatalog, fetchExercisesMeta } from '@/lib/data-api'
import { notifyXpGrants } from '@/lib/xp-notifications'
import { useExerciseCatalogBrowse } from '@/hooks/use-exercise-catalog-browse'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { filterCatalogExercises } from '@/lib/exercise-catalog-browse'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { inferBodyPartFromTarget } from '@/lib/infer-body-part-from-target'
import {
    addTrackedExerciseAndWait,
    isOnboardingFirstExercisePending,
    savePerformanceAndWait,
} from '@/lib/storage'
import { useBack } from '@/hooks/use-back'
import { useTheme } from '@/hooks/use-theme'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import { translateBodyPart, translateTarget, UI } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { Plus, Search } from 'lucide-react'
import { getJoyrideScrollOffset } from '@/lib/joyride-config'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EVENTS, Joyride, type EventData, type Step } from 'react-joyride'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function ExerciseListPage() {
    const navigate = useNavigate()
    const { resolvedTheme } = useTheme()
    const [searchParams, setSearchParams] = useSearchParams()
    const { mutate } = useSWRConfig()
    const { exercises: tracked, addExercise } = useTrackedExercises()
    const [targets, setTargets] = useState<string[]>([])
    const { searchInput, searchQuery, handleSearchChange } = useExerciseFilters({
        includePage: false,
    })

    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customTarget, setCustomTarget] = useState('chest' as string)
    const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())
    const [addWithPerfExercise, setAddWithPerfExercise] = useState<ExerciseDBExercise | null>(null)
    const [selectedExercise, setSelectedExercise] = useState<ExerciseDBExercise | null>(null)
    const [perfWeight, setPerfWeight] = useState(0)
    const [perfReps, setPerfReps] = useState(1)
    const firstExerciseTourActive =
        searchParams.get('tour') === 'onboarding-first' &&
        isOnboardingFirstExercisePending()

    const stopFirstExerciseTour = useCallback(() => {
        const next = new URLSearchParams(searchParams)
        next.delete('tour')
        setSearchParams(next, { replace: true })
    }, [searchParams, setSearchParams])

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
                limit: 2000,
                offset: 0,
            }),
    )

    const { data: metaData } = useSWR('exercise-meta', fetchExercisesMeta)

    useEffect(() => {
        if (!metaData) return
        setTargets(metaData.targets.filter((t) => t !== 'cardio'))
    }, [metaData])

    const { browse, pickZone, pickTarget, pickEquipment, goToStep, goBackInBrowse } =
        useExerciseCatalogBrowse()
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
            goToStep('zone')
        }
        prevSearchQueryRef.current = searchQuery
    }, [searchQuery, goToStep])

    useEffect(() => {
        void Promise.resolve().then(() => setBrokenImageIds(new Set()))
    }, [searchQuery, browse.zone, browse.target, browse.beq])

    useEffect(() => {
        if (isSearchMode) return
        if (browse.step === 'list' && (!browse.zone || !browse.target || !browse.beq)) {
            goToStep('zone')
        } else if (
            browse.step === 'equipment' &&
            (!browse.zone || !browse.target)
        ) {
            goToStep(browse.zone ? 'muscle' : 'zone')
        } else if (browse.step === 'muscle' && !browse.zone) {
            goToStep('zone')
        }
    }, [browse.step, browse.zone, browse.target, browse.beq, goToStep, isSearchMode])

    useEffect(() => {
        if (targets.length > 0 && !targets.includes(customTarget)) {
            setCustomTarget(targets[0]!)
        }
    }, [targets, customTarget])

    const handleHeaderBack = useCallback(() => {
        if (isSearchMode) {
            handleSearchChange('')
            return
        }
        if (goBackInBrowse()) return
        navigateBack()
    }, [isSearchMode, handleSearchChange, goBackInBrowse, navigateBack])

    const firstExerciseOnboardingSteps = useMemo<Step[]>(() => {
        const scrollOffset = getJoyrideScrollOffset()
        const steps: Step[] = [
            {
                target: '[data-tour="first-exercise-search"]',
                title: UI.onboardingFirstExerciseTitle,
                content: UI.onboardingFirstExerciseDescription,
                placement: 'bottom',
                skipScroll: true,
            },
        ]
        if (isSearchMode && catalogExercises.length > 0) {
            steps.push({
                target: '[data-tour="first-exercise-add"]',
                title: UI.onboardingFirstExerciseTourAddTitle,
                content: UI.onboardingFirstExerciseTourAddContent,
                placement: 'left',
                scrollOffset,
            })
        }
        return steps
    }, [isSearchMode, catalogExercises.length, firstExerciseTourActive])

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

    const handleImageError = (exId: string) => {
        setBrokenImageIds((prev) => new Set(prev).add(exId))
    }

    const openAddWithPerf = (ex: ExerciseDBExercise) => {
        if (trackedIds.has(`api-${ex.id}`)) return
        setAddWithPerfExercise(ex)
        setPerfWeight(0)
        setPerfReps(1)
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
                mutate(SWR_KEYS.homeExercises),
                mutate(SWR_KEYS.progress),
            ])
            setAddWithPerfExercise(null)
            const shouldLaunchExerciseTour = isOnboardingFirstExercisePending()
            navigate(
                shouldLaunchExerciseTour
                    ? `/exercise/${trackedId}?tour=onboarding&from=first-exercise`
                    : `/exercise/${trackedId}`,
                { replace: true },
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
        if (!customName.trim()) return
        const id = `custom-${crypto.randomUUID()}`
        const bodyPart = inferBodyPartFromTarget(customTarget)
        void (async () => {
            await addExercise({
                exerciseId: id,
                name: customName.trim(),
                originalName: customName.trim(),
                bodyPart,
                target: customTarget,
                isCustom: true,
            })
            setCustomName('')
            setCustomOpen(false)
        })()
    }

    const customExerciseDialog = (
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
            <DialogTrigger asChild>
                <Button className="h-9 w-full">
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
                    <div className="flex flex-col gap-2">
                        <Label>{UI.muscleGroup}</Label>
                        <Select value={customTarget} onValueChange={setCustomTarget}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {targets.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {translateTarget(t)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleAddCustom}
                        disabled={!customName.trim()}
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
                        brokenImageIds={brokenImageIds}
                        onPickZone={pickZone}
                        onPickTarget={pickTarget}
                        onPickEquipment={pickEquipment}
                        onGoToStep={goToStep}
                        onSelectExercise={setSelectedExercise}
                        onAddExercise={openAddWithPerf}
                        onImageError={handleImageError}
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
                                        size="lg"
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
                                    <img
                                        src={getExerciseImageUrl(selectedExercise.gifUrl)}
                                        alt=""
                                        className="mx-auto max-h-[min(44vh,340px)] w-full object-contain"
                                        onError={(e) => {
                                            ;(e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                                <div className="space-y-3 p-4 pt-4">
                                    <DialogHeader className="space-y-0 p-0 text-left">
                                        <DialogTitle className="break-words pr-8 text-left text-xl capitalize leading-snug">
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
