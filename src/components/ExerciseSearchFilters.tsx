import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { UI, translateBodyPart, translateEquipment, translateTarget } from '@/lib/translations'
import { Search } from 'lucide-react'

export interface ExerciseSearchFiltersProps {
    searchInput: string
    onSearchChange: (value: string) => void
    targetFilter: string
    onTargetFilterChange: (value: string) => void
    targets: string[]

    bodyPartFilter?: string
    onBodyPartFilterChange?: (value: string) => void
    bodyParts?: string[]

    equipmentFilter: string
    onEquipmentFilterChange: (value: string) => void
    equipmentList: string[]
    /** Contenu additionnel à afficher dans la ligne des filtres (ex: bouton Créer) */
    extraSlot?: React.ReactNode
}

export function ExerciseSearchFilters({
    searchInput,
    onSearchChange,
    targetFilter,
    onTargetFilterChange,
    targets,
    equipmentFilter,
    onEquipmentFilterChange,
    equipmentList,
    bodyPartFilter,
    onBodyPartFilterChange,
    bodyParts = [],
    extraSlot,
}: ExerciseSearchFiltersProps) {

    return (
        <>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={UI.searchExercise}
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <div className="mb-4 flex flex-row gap-3">
                <Select value={targetFilter} onValueChange={onTargetFilterChange}>
                    <SelectTrigger className="min-w-[140px] flex-1">
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

                {bodyPartFilter && onBodyPartFilterChange && (
                    <Select value={bodyPartFilter} onValueChange={onBodyPartFilterChange}>
                        <SelectTrigger className="min-w-[170px] flex-1">
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

                <Select value={equipmentFilter} onValueChange={onEquipmentFilterChange}>
                    <SelectTrigger className="min-w-[140px] flex-1">
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
                {extraSlot}
            </div>
        </>
    )
}
