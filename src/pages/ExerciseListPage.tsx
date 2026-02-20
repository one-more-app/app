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
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import {
    CARDIO_EQUIPMENT,
    getExerciseImageUrl,
    sortExercisesByPopularity,
} from '@/lib/exercisedb'
import { savePerformance } from '@/lib/storage'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import { UI, translateBodyPart, translateEquipment, translateTarget } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

// Aligné avec l'API ExerciseDB v1 /bodyparts
const CUSTOM_CATEGORIES = [
    { value: 'back', label: 'Dos' },
    { value: 'chest', label: 'Pectoraux' },
    { value: 'lower arms', label: 'Avant-bras' },
    { value: 'lower legs', label: 'Jambes' },
    { value: 'neck', label: 'Cou' },
    { value: 'shoulders', label: 'Épaules' },
    { value: 'upper arms', label: 'Bras' },
    { value: 'upper legs', label: 'Cuisses' },
    { value: 'waist', label: 'Taille' },
]

function getParamsFromUrl(searchParams: URLSearchParams) {
    return {
        target: searchParams.get('target') || 'all',
        eq: searchParams.get('eq') || 'all',
        q: searchParams.get('q') || '',
        page: Math.max(0, parseInt(searchParams.get('page') || '0', 10)),
    }
}

export function ExerciseListPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { exercises: tracked, addExercise } = useTrackedExercises()
    const [apiExercises, setApiExercises] = useState<ExerciseDBExercise[]>([])
    const [totalFilteredCount, setTotalFilteredCount] = useState(0)
    const targets = localTargets
    const equipmentList = localEquipmentRaw.filter((eq) => !CARDIO_EQUIPMENT.has(eq))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const paramsFromUrl = getParamsFromUrl(searchParams)
    const [targetFilter, setTargetFilter] = useState<string>(paramsFromUrl.target)
    const [equipmentFilter, setEquipmentFilter] = useState<string>(paramsFromUrl.eq)
    const [searchInput, setSearchInput] = useState(paramsFromUrl.q)
    const [searchQuery, setSearchQuery] = useState(paramsFromUrl.q)
    const [page, setPage] = useState(paramsFromUrl.page)
    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customCategory, setCustomCategory] = useState('chest' as string)
    const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())
    const [addWithPerfExercise, setAddWithPerfExercise] = useState<ExerciseDBExercise | null>(null)
    const [perfWeight, setPerfWeight] = useState(0)
    const [perfReps, setPerfReps] = useState(1)

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )

    // Sync state from URL (back/forward navigation)
    useEffect(() => {
        const { target, eq, q, page: p } = getParamsFromUrl(searchParams)
        setTargetFilter(target)
        setEquipmentFilter(eq)
        setSearchInput(q)
        setSearchQuery(q)
        setPage(p)
    }, [searchParams])

    // Reset broken images when exercises list changes (new search/filter)
    useEffect(() => {
        setBrokenImageIds(new Set())
    }, [targetFilter, equipmentFilter, searchQuery])

    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 300)
        return () => clearTimeout(t)
    }, [searchInput])

    // Update URL when search query changes (replace to avoid history spam while typing)
    useEffect(() => {
        const next = new URLSearchParams(searchParams)
        const currentQ = next.get('q') || ''
        if (currentQ !== searchQuery) {
            if (searchQuery) next.set('q', searchQuery)
            else next.delete('q')
            next.delete('page')
            setSearchParams(next, { replace: true })
        }
    }, [searchQuery, searchParams, setSearchParams])

    // Données locales : filtre et pagination sur popularExercises
    useEffect(() => {
        setError(null)
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
            list = list.filter((ex) => ex.equipment === equipmentFilter)
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
        setTotalFilteredCount(sorted.length)
        setApiExercises(sorted.slice(offset, offset + 25))
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

    const updateUrl = (updates: { target?: string; eq?: string; q?: string; page?: number }, replace = false) => {
        const next = new URLSearchParams(searchParams)
        if (updates.target !== undefined) {
            if (updates.target === 'all') next.delete('target')
            else next.set('target', updates.target)
        }
        if (updates.eq !== undefined) {
            if (updates.eq === 'all') next.delete('eq')
            else next.set('eq', updates.eq)
        }
        if (updates.q !== undefined) {
            if (updates.q) next.set('q', updates.q)
            else next.delete('q')
        }
        if (updates.page !== undefined) {
            if (updates.page === 0) next.delete('page')
            else next.set('page', String(updates.page))
        }
        setSearchParams(next, { replace })
    }

    const handleTargetFilterChange = (value: string) => {
        setTargetFilter(value)
        setPage(0)
        updateUrl({ target: value, page: 0 })
    }

    const handleEquipmentFilterChange = (value: string) => {
        setEquipmentFilter(value)
        setPage(0)
        updateUrl({ eq: value, page: 0 })
    }

    const handleSearchChange = (value: string) => {
        setSearchInput(value)
        setPage(0)
    }

    const handlePageChange = (delta: number) => {
        const newPage = Math.max(0, page + delta)
        setPage(newPage)
        updateUrl({ page: newPage })
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
        addExercise({
            exerciseId: id,
            name: customName.trim(),
            originalName: customName.trim(),
            bodyPart: customCategory,
            isCustom: true,
        })
        setCustomName('')
        setCustomOpen(false)
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">{UI.chooseExercises}</h1>

                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={UI.searchExercise}
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                        {targets.length > 0 && (
                            <Select value={targetFilter} onValueChange={handleTargetFilterChange}>
                                <SelectTrigger className="flex-1 min-w-[140px]">
                                    <SelectValue placeholder={UI.filterByTarget} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{UI.all}</SelectItem>
                                    {targets.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {translateTarget(t)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {equipmentList.length > 0 && (
                            <Select value={equipmentFilter} onValueChange={handleEquipmentFilterChange}>
                                <SelectTrigger className="flex-1 min-w-[140px]">
                                    <SelectValue placeholder={UI.filterByEquipment} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{UI.all}</SelectItem>
                                    {equipmentList.map((eq) => (
                                        <SelectItem key={eq} value={eq}>
                                            {translateEquipment(eq)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
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
                                        <Label>{UI.category}</Label>
                                        <Select
                                            value={customCategory}
                                            onValueChange={setCustomCategory}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CUSTOM_CATEGORIES.map((c) => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        {c.label}
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
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
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

                {!loading && filteredExercises.length === 0 && !error && (
                    <p className="py-8 text-center text-muted-foreground">
                        {UI.noExerciseFound}
                    </p>
                )}

                {!loading && filteredExercises.length > 0 && totalFilteredCount > 25 && (
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
