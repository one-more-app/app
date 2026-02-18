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
    fetchBodyPartList,
    fetchExercises,
    fetchExercisesByBodyPart,
    fetchExercisesFiltered,
    getExerciseImageUrl,
    sortExercisesByPopularity,
} from '@/lib/exercisedb'
import type { ExerciseDBExercise } from '@/types'
import { UI, translateBodyPart, translateTarget } from '@/lib/translations'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Aligné avec l'API ExerciseDB v1 /bodyparts
const CUSTOM_CATEGORIES = [
    { value: 'back', label: 'Dos' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'chest', label: 'Pectoraux' },
    { value: 'lower arms', label: 'Avant-bras' },
    { value: 'lower legs', label: 'Jambes' },
    { value: 'neck', label: 'Cou' },
    { value: 'shoulders', label: 'Épaules' },
    { value: 'upper arms', label: 'Bras' },
    { value: 'upper legs', label: 'Cuisses' },
    { value: 'waist', label: 'Taille' },
]

export function ExerciseListPage() {
    const navigate = useNavigate()
    const { exercises: tracked, addExercise } = useTrackedExercises()
    const [apiExercises, setApiExercises] = useState<ExerciseDBExercise[]>([])
    const [bodyParts, setBodyParts] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<string>('all')
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)
    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customCategory, setCustomCategory] = useState('chest' as string)

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )

    useEffect(() => {
        let cancelled = false
        async function loadBodyParts() {
            const list = await fetchBodyPartList()
            if (!cancelled) setBodyParts(list)
        }
        loadBodyParts()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 300)
        return () => clearTimeout(t)
    }, [searchInput])

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
                if (apiQuery && filter !== 'all') {
                    exercises = await fetchExercisesFiltered(filter, apiQuery, 25, offset)
                } else if (apiQuery) {
                    exercises = await fetchExercises(25, offset, apiQuery)
                } else if (filter === 'all') {
                    exercises = await fetchExercises(25, offset)
                } else {
                    exercises = await fetchExercisesByBodyPart(filter, 25, offset)
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
    }, [filter, page, searchQuery])

    const filteredExercises = sortExercisesByPopularity(apiExercises)

    const handleFilterChange = (value: string) => {
        setFilter(value)
        setPage(0)
    }

    const handleSearchChange = (value: string) => {
        setSearchInput(value)
        setPage(0)
    }

    const handleAddFromApi = (ex: ExerciseDBExercise) => {
        if (trackedIds.has(`api-${ex.id}`)) return
        addExercise({
            exerciseId: ex.id,
            name: ex.name,
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
                <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                    {bodyParts.length > 0 && (
                        <Select value={filter} onValueChange={handleFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={UI.filterByBodyPart} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{UI.all}</SelectItem>
                                {bodyParts.map((bp) => (
                                    <SelectItem key={bp} value={bp}>
                                        {translateBodyPart(bp)}
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
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
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
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">{UI.page} {page + 1}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => p + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                )}
            </main>
        </div>
    )
}
