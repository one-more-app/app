import { BackHeader } from '@/components/BackHeader'
import { ExerciseSearchFilters } from '@/components/ExerciseSearchFilters'
import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
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
import {
    localEquipmentList as localEquipmentRaw,
    localTargets,
    popularExercises,
} from '@/data/popular-exercises'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import {
    CARDIO_EQUIPMENT,
    getExerciseImageUrl,
    sortExercisesByPopularity,
} from '@/lib/exercisedb'
import { savePerformance } from '@/lib/storage'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import {
    equipmentMatchesFilter,
    getGroupedEquipmentList,
    translateBodyPart,
    translateTarget,
    UI,
} from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function inferBodyPartFromTarget(target: string): string | undefined {
    // Heuristique pour garder les filtres Home cohérents :
    // Home filtre par `target` (muscle) ET par `bodyPart` (partie du corps).
    // Pour un exo custom, on stocke `target` + on déduit un `bodyPart` approximatif.
    const t = target.toLowerCase()
    const map: Record<string, string> = {
        // Dos
        'upper back': 'back',
        'lower back': 'back',
        lats: 'back',
        'latissimus dorsi': 'back',
        traps: 'back',
        trapezius: 'back',
        rhomboids: 'back',
        'levator scapulae': 'back',

        // Poitrine
        chest: 'chest',
        pectorals: 'chest',
        'upper chest': 'chest',
        'serratus anterior': 'chest',

        // Épaules
        shoulders: 'shoulders',
        delts: 'shoulders',
        deltoids: 'shoulders',
        'rear deltoids': 'shoulders',

        // Bras / avant-bras
        'upper arms': 'upper arms',
        biceps: 'upper arms',
        triceps: 'upper arms',
        brachialis: 'upper arms',
        'lower arms': 'lower arms',
        forearms: 'lower arms',
        'wrist flexors': 'lower arms',
        'wrist extensors': 'lower arms',
        'grip muscles': 'lower arms',
        wrists: 'lower arms',
        hands: 'lower arms',

        // Gainage
        abs: 'waist',
        abdominals: 'waist',
        core: 'waist',
        obliques: 'waist',
        'lower abs': 'waist',

        // Jambes (haut)
        'upper legs': 'upper legs',
        glutes: 'upper legs',
        hamstrings: 'upper legs',
        quadriceps: 'upper legs',
        quads: 'upper legs',
        'hip flexors': 'upper legs',
        groin: 'upper legs',
        'inner thighs': 'upper legs',
        adductors: 'upper legs',
        abductors: 'upper legs',
        'rotator cuff': 'shoulders', // fallback rare mais évite un trou

        // Jambes (bas)
        calves: 'lower legs',
        soleus: 'lower legs',
        shins: 'lower legs',
        ankles: 'lower legs',
        'ankle stabilizers': 'lower legs',
        feet: 'lower legs',

        // Cou
        neck: 'neck',
    }
    return map[t]
}

export function ExerciseListPage() {
    const navigate = useNavigate()
    const { exercises: tracked, addExercise } = useTrackedExercises()
    const [apiExercises, setApiExercises] = useState<ExerciseDBExercise[]>([])
    const [totalFilteredCount, setTotalFilteredCount] = useState(0)
    const targets = localTargets
    const equipmentList = getGroupedEquipmentList(
        localEquipmentRaw.filter((eq) => !CARDIO_EQUIPMENT.has(eq))
    )
    const [error, setError] = useState<string | null>(null)

    const {
        searchInput,
        searchQuery,
        targetFilter,
        equipmentFilter,
        page = 0,
        handleTargetChange,
        handleEquipmentChange,
        handleSearchChange,
        handlePageChange,
    } = useExerciseFilters({ includePage: true })

    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customTarget, setCustomTarget] = useState(
        () => targets[0] ?? ('chest' as string),
    )
    const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())
    const [addWithPerfExercise, setAddWithPerfExercise] = useState<ExerciseDBExercise | null>(null)
    const [perfWeight, setPerfWeight] = useState(0)
    const [perfReps, setPerfReps] = useState(1)

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )

    // Reset broken images when exercises list changes (new search/filter)
    useEffect(() => {
        void Promise.resolve().then(() => setBrokenImageIds(new Set()))
    }, [targetFilter, equipmentFilter, searchQuery])

    // Données locales : filtre et pagination sur popularExercises
    useEffect(() => {
        void Promise.resolve().then(() => setError(null))
        const offset = page * 25
        const apiQuery = searchQuery.trim()
            ? translateSearchQueryToEnglish(searchQuery.trim()).toLowerCase()
            : ''
        const searchRaw = searchQuery.trim().toLowerCase()
        let list = popularExercises.filter(
            (ex) =>
                ex.bodyPart !== 'cardio' &&
                !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment))
        )
        if (targetFilter !== 'all') {
            list = list.filter((ex) => ex.target === targetFilter)
        }
        if (equipmentFilter !== 'all') {
            list = list.filter((ex) =>
                equipmentMatchesFilter(ex.equipment, equipmentFilter)
            )
        }
        if (apiQuery || searchRaw) {
            list = list.filter((ex) => {
                const matchEn = apiQuery && ex.name.toLowerCase().includes(apiQuery)
                const exFr = (ex as { nameFr?: string }).nameFr
                const matchFr = searchRaw && exFr?.toLowerCase().includes(searchRaw)
                return matchEn || matchFr || (searchRaw && ex.name.toLowerCase().includes(searchRaw))
            })
        }
        const sorted = sortExercisesByPopularity(list)
        const nextTotalFilteredCount = sorted.length
        const nextApiExercises = sorted.slice(offset, offset + 25)
        void Promise.resolve().then(() => {
            setTotalFilteredCount(nextTotalFilteredCount)
            setApiExercises(nextApiExercises)
        })
    }, [targetFilter, equipmentFilter, page, searchQuery])

    const filteredExercises = sortExercisesByPopularity(
        apiExercises
            .filter(
                (ex) =>
                    ex.bodyPart !== 'cardio' &&
                    !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment))
            )
            .filter(
                (ex) =>
                    ex.gifUrl?.trim() &&
                    !brokenImageIds.has(ex.id)
            )
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

    const handleAddWithPerfSubmit = () => {
        if (!addWithPerfExercise || perfReps <= 0) return
        const ex = addWithPerfExercise
        const trackedId = `api-${ex.id}`
        addExercise({
            exerciseId: ex.id,
            name: ex.name,
            originalName: ex.name,
            bodyPart: ex.bodyPart,
            target: ex.target,
            equipment: ex.equipment,
            gifUrl: ex.gifUrl,
            isCustom: false,
        })
        savePerformance(trackedId, perfWeight, perfReps)
        setAddWithPerfExercise(null)
        navigate(`/exercise/${trackedId}`)
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
        addExercise({
            exerciseId: id,
            name: customName.trim(),
            originalName: customName.trim(),
            bodyPart,
            target: customTarget,
            isCustom: true,
        })
        setCustomName('')
        setCustomOpen(false)
    }

    return (
        <div className="min-h-screen bg-background">
            <BackHeader compact title={UI.chooseExercises} />

            <main className="mx-auto max-w-2xl px-4 py-4">
                <ExerciseSearchFilters
                    searchInput={searchInput}
                    onSearchChange={handleSearchChange}
                    targetFilter={targetFilter}
                    onTargetFilterChange={handleTargetChange}
                    targets={targets}
                    equipmentFilter={equipmentFilter}
                    onEquipmentFilterChange={handleEquipmentChange}
                    equipmentList={equipmentList}
                    extraSlot={
                        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="w-full">
                                    <Plus className="mr-1 size-4" />
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
                                        <Select
                                            value={customTarget}
                                            onValueChange={setCustomTarget}
                                        >
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
                    }
                />
                {error ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                        <p className="text-destructive">{error}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {UI.apiErrorCustom}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {filteredExercises.map((ex) => {
                            const isTracked = trackedIds.has(`api-${ex.id}`)
                            return (
                                <li key={ex.id}>
                                    <Card
                                        className="cursor-pointer transition-colors hover:bg-muted/50"
                                        onClick={() => navigate(`/exercises/${ex.id}`)}
                                    >
                                        <CardHeader className="flex flex-row items-center">
                                            <img
                                                src={getExerciseImageUrl(ex.gifUrl)}
                                                alt=""
                                                className="size-12 rounded-lg object-cover bg-muted"
                                                onError={() => handleImageError(ex.id)}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate capitalize">{ex.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="mt-1">
                                                        {translateBodyPart(ex.bodyPart)}
                                                    </Badge>
                                                    <Badge variant="secondary" className="mt-1">
                                                        {translateTarget(ex.target)}
                                                    </Badge>
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                disabled={isTracked}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openAddWithPerf(ex)
                                                }}
                                            >
                                                {isTracked ? UI.added : UI.add}
                                            </Button>
                                        </CardHeader>
                                    </Card>
                                </li>
                            )
                        })}
                    </ul>
                )}

                {filteredExercises.length === 0 && !error && (
                    <p className="py-8 text-center text-muted-foreground">
                        {UI.noExerciseFound}
                    </p>
                )}

                {filteredExercises.length > 0 && totalFilteredCount > 25 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === 0}
                            onClick={() => handlePageChange(-1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">{UI.page} {page + 1}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={(page + 1) * 25 >= totalFilteredCount}
                            onClick={() => handlePageChange(1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
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
            </main>
        </div>
    )
}
