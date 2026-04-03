import {
    HierarchicalFilterControl,
    type HierarchicalSelection,
} from '@/components/HierarchicalFilterControl'
import {
    buildEquipmentByParent,
    isEquipmentSelectionEmpty,
    type EquipmentSelection,
} from '@/lib/equipment-filter'
import { translateEquipment, UI } from '@/lib/translations'
import { useMemo } from 'react'

export interface EquipmentFilterControlProps {
    selection: EquipmentSelection
    onChange: (next: EquipmentSelection) => void
    parentOptions: string[]
    availableRawEquipment: string[]
    className?: string
}

export function EquipmentFilterControl({
    selection,
    onChange,
    parentOptions,
    availableRawEquipment,
    className,
}: EquipmentFilterControlProps) {
    const byParent = useMemo(
        () => buildEquipmentByParent(parentOptions, availableRawEquipment),
        [parentOptions, availableRawEquipment],
    )
    const parents = useMemo(
        () => parentOptions.filter((p) => (byParent[p] ?? []).length > 0),
        [parentOptions, byParent],
    )

    return (
        <HierarchicalFilterControl
            title={UI.filterByEquipment}
            selection={selection as HierarchicalSelection}
            onChange={(next) => onChange(next as EquipmentSelection)}
            groups={parents}
            byGroup={byParent}
            isSelectionEmpty={(sel) =>
                isEquipmentSelectionEmpty(sel as EquipmentSelection)
            }
            allLabel={UI.all}
            translateGroup={translateEquipment}
            translateChild={translateEquipment}
            className={className}
        />
    )
}
