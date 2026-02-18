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
import { popularExercises } from '@/data/popular-exercises'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import { fetchBodyPartList, getExerciseImageUrl } from '@/lib/exercisedb'
import { UI, translateBodyPart, translateEquipment, translateTarget } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { ArrowLeft, Loader2, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
    const [bodyParts, setBodyParts] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<string>('all')
    const [equipmentFilter, setEquipmentFilter] = useState<string>('all')
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [customOpen, setCustomOpen] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customCategory, setCustomCategory] = useState('chest' as string)

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )

    const equipmentList = useMemo(() => {
        const eq = new Set(popularExercises.map((e) => e.equipment).filter(Boolean))
        return [...eq].sort((a, b) => a.localeCompare(b))
    }, [])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchBodyPartList()
            .then((list) => {
                if (!cancelled) setBodyParts(list)
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 300)
        return () => clearTimeout(t)
    }, [searchInput])


    const apiQuery = searchQuery.trim()
        ? translateSearchQueryToEnglish(searchQuery.trim())
        : ''
    const filteredExercises = popularExercises
        .filter((ex) => {
            if (filter !== 'all' && ex.bodyPart !== filter) return false
            if (equipmentFilter !== 'all' && ex.equipment !== equipmentFilter) return false
            if (apiQuery) {
                const q = apiQuery.toLowerCase()
                if (!ex.name.toLowerCase().includes(q)) return false
            }
            return true
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

    const handleFilterChange = (value: string) => {
        setFilter(value)
    }

    const handleEquipmentFilterChange = (value: string) => {
        setEquipmentFilter(value)
    }

    const handleSearchChange = (value: string) => {
        setSearchInput(value)
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
                        {bodyParts.length > 0 && (
                            <Select value={filter} onValueChange={handleFilterChange}>
                                <SelectTrigger className="flex-1 min-w-[140px]">
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

            </main>
        </div>
    )
}
