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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import {
    CARDIO_EQUIPMENT,
    fetchEquipmentList,
    fetchExercises,
    fetchExercisesByTarget,
    fetchExercisesFilteredByTarget,
    fetchMuscleList,
    getExerciseImageUrl,
    sortExercisesByPopularity,
} from '@/lib/exercisedb'
import type { ExerciseDBExercise } from '@/types'
import { UI, translateBodyPart, translateEquipment, translateTarget } from '@/lib/translations'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
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
    const [targets, setTargets] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const paramsFromUrl = getParamsFromUrl(searchParams)
    const [targetFilter, setTargetFilter] = useState<string>(paramsFromUrl.target)
    const [equipmentFilter, setEquipmentFilter] = useState<string>(paramsFromUrl.eq)
    const [equipmentList, setEquipmentList] = useState<string[]>([])
    const [searchInput, setSearchInput] = useState(paramsFromUrl.q)
    const [searchQuery, setSearchQuery] = useState(paramsFromUrl.q)
    const [page, setPage] = useState(paramsFromUrl.page)
    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customCategory, setCustomCategory] = useState('chest' as string)
    const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())

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
        let cancelled = false
        async function load() {
            const [muscles, eqs] = await Promise.all([
                fetchMuscleList(),
                fetchEquipmentList(),
            ])
            if (!cancelled) {
                setTargets(muscles)
                setEquipmentList(
                    [...eqs]
                        .filter((eq) => !CARDIO_EQUIPMENT.has(eq))
                        .sort((a, b) => a.localeCompare(b))
                )
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

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

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        async function load() {
            try {
                const offset = page * 25
                let exercises: ExerciseDBExercise[]
                const apiQuery = searchQuery.trim()
                    ? translateSearchQueryToEnglish(searchQuery.trim())
                    : ''
                const equip = equipmentFilter !== 'all' ? equipmentFilter : ''
                if (apiQuery && targetFilter !== 'all') {
                    exercises = await fetchExercisesFilteredByTarget(targetFilter, apiQuery, 25, offset, equip)
                } else if (apiQuery) {
                    exercises = await fetchExercises(25, offset, apiQuery, equip)
                } else if (targetFilter === 'all') {
                    exercises = await fetchExercises(25, offset, '', equip)
                } else {
                    exercises = await fetchExercisesByTarget(targetFilter, 25, offset, equip)
                }
                if (!cancelled) setApiExercises(exercises)
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
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

    const handleAddFromApi = (ex: ExerciseDBExercise) => {
        if (trackedIds.has(`api-${ex.id}`)) return
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
                                                    handleAddFromApi(ex)
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

                {!loading && filteredExercises.length > 0 && (
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
                            onClick={() => handlePageChange(1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                )}
            </main>
        </div>
    )
}
