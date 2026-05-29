import { EquipmentFilterControl } from '@/components/EquipmentFilterControl'
import { MuscleFilterControl } from '@/components/MuscleFilterControl'
import { Input } from '@/components/ui/input'
import type { EquipmentSelection } from '@/lib/equipment-filter'
import type { MuscleSelection } from '@/lib/muscle-filter'
import { UI } from '@/lib/translations'
import { Search } from 'lucide-react'

export interface ExerciseSearchFiltersProps {
    searchInput: string
    onSearchChange: (value: string) => void
    muscleFilter: MuscleSelection
    onMuscleFilterChange: (value: MuscleSelection) => void
    targets: string[]

    equipmentFilter: EquipmentSelection
    onEquipmentFilterChange: (value: EquipmentSelection) => void
    equipmentList: string[]
    availableRawEquipment: string[]
    /** Contenu additionnel à afficher sous les filtres (ex: bouton Créer) */
    extraSlot?: React.ReactNode
}

export function ExerciseSearchFilters({
    searchInput,
    onSearchChange,
    muscleFilter,
    onMuscleFilterChange,
    targets,
    equipmentFilter,
    onEquipmentFilterChange,
    equipmentList,
    availableRawEquipment,
    extraSlot,
}: ExerciseSearchFiltersProps) {
    return (
        <>
            <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={UI.searchExercise}
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 bg-card"
                />
            </div>
            <div className="mb-4 space-y-2">
                <MuscleFilterControl
                    selection={muscleFilter}
                    onChange={onMuscleFilterChange}
                    targets={targets}
                />
                <EquipmentFilterControl
                    selection={equipmentFilter}
                    onChange={onEquipmentFilterChange}
                    parentOptions={equipmentList}
                    availableRawEquipment={availableRawEquipment}
                />

            </div>
            <div className="mb-4">
                {extraSlot}
            </div>
        </>
    )
}
